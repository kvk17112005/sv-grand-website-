import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYMENT_STATES = ["pending", "success", "failed", "cancelled"];

export function buildUpiPaymentUri({ merchantVpa, merchantName, amount, bookingReference, paymentId }) {
  const parameters = new URLSearchParams({
    pa: merchantVpa,
    pn: merchantName,
    am: Number(amount).toFixed(2),
    cu: "INR",
    tr: paymentId,
    tn: `Hotel booking ${bookingReference}`,
  });
  return `upi://pay?${parameters.toString()}`;
}

export function verifyPaymentWebhookSignature(rawBody, signature) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !Buffer.isBuffer(rawBody) || typeof signature !== "string") return false;

  const provided = signature.replace(/^sha256=/i, "");
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(provided, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function signPaymentWebhookForTests(rawBody, secret) {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

export function paymentWebhookConfigured() {
  return Boolean(process.env.PAYMENT_WEBHOOK_SECRET);
}

export function normalizeProviderEvent(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const status = String(body.status || "").toLowerCase();
  const amountText = String(body.amount ?? "").trim();
  const amountParts = amountText.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  const amount = Number(amountText);
  const amountPaise =
    amountParts && amountParts[1].length <= 12
      ? (BigInt(amountParts[1]) * 100n + BigInt((amountParts[2] || "").padEnd(2, "0") || "0")).toString()
      : null;
  const event = {
    eventId: String(body.eventId || "").trim(),
    paymentId: String(body.paymentId || "").trim(),
    bookingId: String(body.bookingId || "").trim(),
    bookingReference: String(body.bookingReference || "").trim(),
    amount,
    amountPaise,
    currency: String(body.currency || "").trim().toUpperCase(),
    status,
    transactionReference: String(body.transactionReference || "").trim(),
  };

  if (
    !event.eventId ||
    event.eventId.length > 200 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.paymentId) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.bookingId) ||
    !event.bookingReference ||
    event.amountPaise === null ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    event.currency !== "INR" ||
    !PAYMENT_STATES.includes(status) ||
    event.transactionReference.length > 200 ||
    (status === "success" && !event.transactionReference)
  ) {
    return null;
  }
  return event;
}
