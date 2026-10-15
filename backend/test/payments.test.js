import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createUser, resetAndMigrate } from "./support/db.js";
import { startTestServer, stopTestServer } from "./support/app.js";
import { createClient } from "./support/client.js";

let baseUrl;

function isoDate(offsetDays) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

before(async () => {
  await resetAndMigrate();
  await createUser({ name: "Front Desk", email: "admin@svgrand.com", role: "admin" });
  baseUrl = await startTestServer();
});

after(async () => {
  await stopTestServer();
});

async function adminClient() {
  const client = createClient(baseUrl);
  const res = await client.post(
    "/api/auth/login",
    { email: "admin@svgrand.com", password: "Password@123" },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return client;
}

async function createBookingWithUtr({ email, phone, utr, dayOffset }) {
  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "Payment Guest",
      phone,
      email,
      checkIn: isoDate(dayOffset),
      checkOut: isoDate(dayOffset + 1),
      adults: 1,
      totalGuests: 1,
    },
    { csrf: true }
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const reference = created.data.booking.requestReference;
  const paid = await guest.post(
    `/api/bookings/${reference}/payment`,
    { utr },
    { csrf: true }
  );
  assert.equal(paid.status, 200, JSON.stringify(paid.data));
  return { guest, reference };
}

test("admin can verify a submitted UPI payment", async () => {
  const admin = await adminClient();
  const { reference } = await createBookingWithUtr({
    email: "verify1@example.com",
    phone: "9700000001",
    utr: "UTRVERIFY0001",
    dayOffset: 40,
  });

  const res = await admin.post(
    `/api/admin/bookings/${reference}/payment/verify`,
    { approve: true },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const booking = res.data.booking;
  assert.equal(booking.paymentStatus, "verified");
  assert.equal(booking.payments.length, 1);
  assert.equal(booking.payments[0].status, "verified");
});

test("rejecting a payment reopens the booking and records the reason", async () => {
  const admin = await adminClient();
  const { guest, reference } = await createBookingWithUtr({
    email: "verify2@example.com",
    phone: "9700000002",
    utr: "UTRREJECT0002",
    dayOffset: 42,
  });

  const res = await admin.post(
    `/api/admin/bookings/${reference}/payment/verify`,
    { approve: false, reason: "UTR not found in bank statement" },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  const booking = res.data.booking;
  assert.equal(booking.status, "pending_payment");
  assert.equal(booking.paymentStatus, "rejected");
  assert.equal(booking.payments[0].status, "rejected");
  assert.equal(booking.payments[0].rejectionReason, "UTR not found in bank statement");

  // Guest can correct and resubmit a new reference.
  const retry = await guest.post(
    `/api/bookings/${reference}/payment`,
    { utr: "UTRREJECT0003" },
    { csrf: true }
  );
  assert.equal(retry.status, 200, JSON.stringify(retry.data));
  assert.equal(retry.data.booking.status, "payment_verification");
  assert.equal(retry.data.booking.paymentStatus, "reference_submitted");
});

test("rejecting a payment without a reason is refused", async () => {
  const admin = await adminClient();
  const { reference } = await createBookingWithUtr({
    email: "verify3@example.com",
    phone: "9700000003",
    utr: "UTRREJECT0004",
    dayOffset: 44,
  });

  const res = await admin.post(
    `/api/admin/bookings/${reference}/payment/verify`,
    { approve: false },
    { csrf: true }
  );
  assert.equal(res.status, 400);
});

test("a booking with no submitted reference cannot be verified", async () => {
  const admin = await adminClient();
  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "No Payment Guest",
      phone: "9700000005",
      email: "verify4@example.com",
      checkIn: isoDate(46),
      checkOut: isoDate(47),
      adults: 1,
      totalGuests: 1,
    },
    { csrf: true }
  );
  const reference = created.data.booking.requestReference;

  const res = await admin.post(
    `/api/admin/bookings/${reference}/payment/verify`,
    { approve: true },
    { csrf: true }
  );
  assert.equal(res.status, 400);
});

test("a guest can link a matching booking to their account", async () => {
  const userId = await createUser({
    name: "Link Me",
    email: "linkme@example.com",
    phone: "9800011111",
  });

  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "Link Me",
      phone: "9800011111",
      email: "linkme@example.com",
      checkIn: isoDate(50),
      checkOut: isoDate(51),
      adults: 1,
      totalGuests: 1,
    },
    { csrf: true }
  );
  const reference = created.data.booking.requestReference;

  const user = createClient(baseUrl);
  const login = await user.post(
    "/api/auth/login",
    { email: "linkme@example.com", password: "Password@123" },
    { csrf: true }
  );
  assert.equal(login.status, 200, JSON.stringify(login.data));

  const res = await user.post(
    `/api/bookings/${reference}/link`,
    undefined,
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.booking.userId, userId);
});

test("a guest cannot link a booking that belongs to someone else", async () => {
  await createUser({
    name: "Outsider",
    email: "outsider@example.com",
    phone: "9800022222",
  });

  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "Real Guest",
      phone: "9800033333",
      email: "realguest@example.com",
      checkIn: isoDate(52),
      checkOut: isoDate(53),
      adults: 1,
      totalGuests: 1,
    },
    { csrf: true }
  );
  const reference = created.data.booking.requestReference;

  const user = createClient(baseUrl);
  await user.post(
    "/api/auth/login",
    { email: "outsider@example.com", password: "Password@123" },
    { csrf: true }
  );

  const res = await user.post(
    `/api/bookings/${reference}/link`,
    undefined,
    { csrf: true }
  );
  assert.equal(res.status, 403);
});
