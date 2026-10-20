import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildUpiPaymentUri,
  normalizeProviderEvent,
  signPaymentWebhookForTests,
  verifyPaymentWebhookSignature,
} from "../src/services/paymentProvider.js";

const paymentId = "eaa3863b-f66a-4669-a20f-384bd99f3cee";
const bookingId = "855ac68f-04ed-42af-b104-ec18994d8486";

test("UPI payment URI encodes merchant, booking amount, and INR details", () => {
  const uri = new URL(buildUpiPaymentUri({
    merchantVpa: "3341101017051@cnrb",
    merchantName: "SV Grand & Suites",
    amount: 3000,
    bookingReference: "SVG-123456",
    paymentId,
  }));
  assert.equal(uri.protocol, "upi:");
  assert.equal(uri.hostname, "pay");
  assert.equal(uri.searchParams.get("pa"), "3341101017051@cnrb");
  assert.equal(uri.searchParams.get("pn"), "SV Grand & Suites");
  assert.equal(uri.searchParams.get("am"), "3000.00");
  assert.equal(uri.searchParams.get("cu"), "INR");
  assert.equal(uri.searchParams.get("tr"), paymentId);
});

test("provider event amounts normalize to paise without rounding", () => {
  const base = {
    eventId: "provider-event",
    paymentId,
    bookingId,
    bookingReference: "SVG-123456",
    amount: "3000.01",
    currency: "INR",
    status: "success",
    transactionReference: "BANK-123456",
  };
  assert.equal(normalizeProviderEvent(base).amountPaise, "300001");
  assert.equal(normalizeProviderEvent({ ...base, amount: "3000.001" }), null);
  assert.equal(normalizeProviderEvent({ ...base, amount: "0" }), null);
});

test("provider webhook signatures validate against the exact raw payload", () => {
  const priorSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  const secret = "unit-test-webhook-secret";
  const payload = Buffer.from('{"status":"success"}');
  process.env.PAYMENT_WEBHOOK_SECRET = secret;
  try {
    const signature = signPaymentWebhookForTests(payload, secret);
    assert.equal(verifyPaymentWebhookSignature(payload, signature), true);
    assert.equal(verifyPaymentWebhookSignature(Buffer.from('{"status":"failed"}'), signature), false);
    assert.equal(verifyPaymentWebhookSignature(payload, "sha256=00"), false);
  } finally {
    if (priorSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET;
    else process.env.PAYMENT_WEBHOOK_SECRET = priorSecret;
  }
});
