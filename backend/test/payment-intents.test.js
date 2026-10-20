import { createHmac } from "node:crypto";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createUser, resetAndMigrate } from "./support/db.js";
import { startTestServer, stopTestServer } from "./support/app.js";
import { createClient } from "./support/client.js";

let baseUrl;
let originalWebhookSecret;

function isoDate(offsetDays) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

before(async () => {
  originalWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  process.env.PAYMENT_WEBHOOK_SECRET = "test-webhook-secret-for-upi-tests";
  await resetAndMigrate();
  await createUser({ name: "Front Desk", email: "admin@svgrand.com", role: "admin" });
  baseUrl = await startTestServer();
});

after(async () => {
  await stopTestServer();
  if (originalWebhookSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET;
  else process.env.PAYMENT_WEBHOOK_SECRET = originalWebhookSecret;
});

async function createBooking(dayOffset, overrides = {}) {
  const guest = createClient(baseUrl);
  const details = {
    roomName: "AC Single Room",
    name: "UPI Guest",
    phone: `97000${String(dayOffset).padStart(5, "0")}`,
    email: `upi-${dayOffset}@example.com`,
    checkIn: isoDate(dayOffset),
    checkOut: isoDate(dayOffset + 1),
    adults: 1,
    totalGuests: 1,
    ...overrides,
  };
  const response = await guest.post(
    "/api/bookings",
    details,
    { csrf: true }
  );
  return { guest, details, response };
}

async function createIntent(dayOffset) {
  const created = await createBooking(dayOffset);
  assert.equal(created.response.status, 201, JSON.stringify(created.response.data));
  const payment = await created.guest.post(
    `/api/bookings/${created.response.data.booking.id}/payment-intent`,
    {},
    { csrf: true }
  );
  assert.equal(payment.status, 200, JSON.stringify(payment.data));
  return { ...created, intent: payment.data.intent };
}

async function postWebhook(payload, signatureOverride) {
  const rawBody = JSON.stringify(payload);
  const signature =
    signatureOverride ||
    `sha256=${createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex")}`;
  const response = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Payment-Signature": signature,
    },
    body: rawBody,
  });
  return { status: response.status, data: await response.json() };
}

function successEvent(booking, intent, eventId = "provider-event-success-1") {
  return {
    eventId,
    paymentId: intent.paymentId,
    bookingId: booking.id,
    bookingReference: booking.requestReference,
    amount: intent.amount,
    currency: intent.currency,
    status: "success",
    transactionReference: `BANK-${eventId}`,
  };
}

test("backend quote and intent ignore frontend amounts and encode the merchant payment URI", async () => {
  const created = await createBooking(80, { grandTotal: 1, roomTotal: 1, price: 1 });
  assert.equal(created.response.status, 201, JSON.stringify(created.response.data));
  assert.equal(created.response.data.booking.grandTotal, 1500);
  assert.equal(created.response.data.booking.paymentStatus, "pending");

  const quote = await created.guest.post(
    "/api/bookings/quote",
    { ...created.details, grandTotal: 0 },
    { csrf: true }
  );
  assert.equal(quote.status, 200, JSON.stringify(quote.data));
  assert.equal(quote.data.quote.grandTotal, 1500);

  const intentResponse = await created.guest.post(
    `/api/bookings/${created.response.data.booking.id}/payment-intent`,
    {},
    { csrf: true }
  );
  const intent = intentResponse.data.intent;
  assert.equal(intentResponse.data.booking.email, undefined);
  assert.equal(intentResponse.data.booking.phone, undefined);
  assert.equal(intent.amount, 1500);
  assert.equal(intent.merchantVpa, "3341101017051@cnrb");
  assert.equal(intent.currency, "INR");
  const parameters = new URL(intent.upiUri).searchParams;
  assert.equal(parameters.get("pa"), "3341101017051@cnrb");
  assert.equal(parameters.get("pn"), intent.merchantName);
  assert.equal(parameters.get("am"), "1500.00");
  assert.equal(parameters.get("cu"), "INR");
  assert.equal(parameters.get("tr"), intent.paymentId);
});

test("booking and payment retries reuse the original records", async () => {
  const key = "1322e312-aec3-4e4d-b994-a5661df18bcd";
  const created = await createBooking(82, { idempotencyKey: key, grandTotal: 2 });
  assert.equal(created.response.status, 201);
  const retry = await created.guest.post(
    "/api/bookings",
    { ...created.details, idempotencyKey: key, grandTotal: 999999 },
    { csrf: true }
  );
  assert.equal(retry.status, 201, JSON.stringify(retry.data));
  assert.equal(retry.data.booking.id, created.response.data.booking.id);

  const changedRequest = await created.guest.post(
    "/api/bookings",
    { ...created.details, checkIn: isoDate(83), checkOut: isoDate(84), idempotencyKey: key },
    { csrf: true }
  );
  assert.equal(changedRequest.status, 409);

  const firstIntent = await created.guest.post(
    `/api/bookings/${created.response.data.booking.id}/payment-intent`,
    {},
    { csrf: true }
  );
  const retryIntent = await created.guest.post(
    `/api/bookings/${created.response.data.booking.id}/payment-intent`,
    {},
    { csrf: true }
  );
  assert.equal(firstIntent.data.intent.paymentId, retryIntent.data.intent.paymentId);
  const { pool } = await import("../src/db.js");
  const payments = await pool.query(
    "SELECT count(*)::int AS count FROM payments WHERE booking_id = $1 AND provider = 'native_upi'",
    [created.response.data.booking.id]
  );
  assert.equal(payments.rows[0].count, 1);
});

test("backend pricing includes active coupons, add-ons, and the selected room count", async () => {
  const { guest, details } = await createBooking(15, {
    checkOut: isoDate(17),
    roomsCount: 2,
    addOnCodes: ["breakfast"],
    couponCode: "WELCOME50",
    grandTotal: 1,
  });
  const quote = await guest.post(
    "/api/bookings/quote",
    { ...details, grandTotal: 0 },
    { csrf: true }
  );
  assert.equal(quote.status, 200, JSON.stringify(quote.data));
  assert.equal(quote.data.quote.roomTotal, 6000);
  assert.equal(quote.data.quote.addOnsTotal, 1196);
  assert.equal(quote.data.quote.discountAmount, 1500);
  assert.equal(quote.data.quote.grandTotal, 5696);

  const created = await guest.post(
    "/api/bookings",
    details,
    { csrf: true }
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  assert.equal(created.data.booking.roomsCount, 2);
  assert.equal(created.data.booking.grandTotal, quote.data.quote.grandTotal);

  const intent = await guest.post(
    `/api/bookings/${created.data.booking.id}/payment-intent`,
    {},
    { csrf: true }
  );
  assert.equal(intent.data.intent.amount, quote.data.quote.grandTotal);
});

test("payment stays pending on untrusted callbacks and rejects amount or signature mismatches", async () => {
  const created = await createIntent(84);
  const correct = successEvent(created.response.data.booking, created.intent, "bad-amount-event");
  const wrongAmount = await postWebhook({ ...correct, amount: 1 });
  assert.equal(wrongAmount.status, 409);

  const invalidSignature = await postWebhook(
    successEvent(created.response.data.booking, created.intent, "invalid-signature-event"),
    "sha256=00"
  );
  assert.equal(invalidSignature.status, 401);

  const state = await created.guest.get(`/api/payments/${created.intent.paymentId}`);
  assert.equal(state.data.payment.status, "pending");
  assert.equal(state.data.booking.status, "pending_payment");
  assert.equal(state.data.booking.email, undefined);
  assert.equal(state.data.booking.phone, undefined);
});

test("signed failed and cancelled events update payment state without confirming a booking", async () => {
  for (const [offset, status] of [[86, "failed"], [88, "cancelled"]]) {
    const created = await createIntent(offset);
    const response = await postWebhook({
      eventId: `provider-${status}-${offset}`,
      paymentId: created.intent.paymentId,
      bookingId: created.response.data.booking.id,
      bookingReference: created.response.data.booking.requestReference,
      amount: created.intent.amount,
      currency: created.intent.currency,
      status,
      transactionReference: "",
    });
    assert.equal(response.status, 200, JSON.stringify(response.data));
    const state = await created.guest.get(`/api/payments/${created.intent.paymentId}`);
    assert.equal(state.data.payment.status, status);
    assert.equal(state.data.booking.status, "pending_payment");
    assert.equal(state.data.booking.paymentStatus, status);
  }
});

test("a signed successful callback verifies the payment and confirms exactly once", async () => {
  const created = await createIntent(90);
  const event = successEvent(created.response.data.booking, created.intent);
  const response = await postWebhook(event);
  assert.equal(response.status, 200, JSON.stringify(response.data));
  assert.equal(response.data.duplicate, false);

  const duplicate = await postWebhook(event);
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.data.duplicate, true);

  const state = await created.guest.get(`/api/payments/${created.intent.paymentId}`);
  assert.equal(state.data.payment.status, "success");
  assert.equal(state.data.payment.transactionReference, event.transactionReference);
  assert.equal(state.data.booking.paymentStatus, "success");
  assert.equal(state.data.booking.status, "confirmed");
  assert.match(state.data.booking.bookingId, /^SVG-\d{6}$/);
  assert.equal(state.data.booking.payments.length, 1);

  const admin = createClient(baseUrl);
  await admin.post(
    "/api/auth/login",
    { email: "admin@svgrand.com", password: "Password@123" },
    { csrf: true }
  );
  const repeatedConfirmation = await admin.patch(
    `/api/admin/bookings/${state.data.booking.requestReference}/status`,
    { status: "confirmed" },
    { csrf: true }
  );
  assert.equal(repeatedConfirmation.status, 200, JSON.stringify(repeatedConfirmation.data));
  assert.equal(repeatedConfirmation.data.booking.status, "confirmed");
});

test("successful payment atomically assigns each booked room", async () => {
  const created = await createBooking(100, { roomsCount: 2 });
  assert.equal(created.response.status, 201);
  const intentResponse = await created.guest.post(
    `/api/bookings/${created.response.data.booking.id}/payment-intent`,
    {},
    { csrf: true }
  );
  const intent = intentResponse.data.intent;
  const event = successEvent(created.response.data.booking, intent, "two-room-success");
  const callback = await postWebhook(event);
  assert.equal(callback.status, 200, JSON.stringify(callback.data));
  assert.equal(callback.data.duplicate, false);

  const { pool } = await import("../src/db.js");
  const assignments = await pool.query(
    `SELECT count(*)::int AS count, count(DISTINCT physical_room_id)::int AS rooms
       FROM booking_rooms WHERE booking_id = $1 AND is_active = true`,
    [created.response.data.booking.id]
  );
  assert.equal(assignments.rows[0].count, 2);
  assert.equal(assignments.rows[0].rooms, 2);
});

test("unverified bookings cannot be confirmed by an admin status update", async () => {
  const created = await createBooking(92);
  const admin = createClient(baseUrl);
  await admin.post(
    "/api/auth/login",
    { email: "admin@svgrand.com", password: "Password@123" },
    { csrf: true }
  );
  const response = await admin.patch(
    `/api/admin/bookings/${created.response.data.booking.requestReference}/status`,
    { status: "confirmed" },
    { csrf: true }
  );
  assert.equal(response.status, 409);
});
