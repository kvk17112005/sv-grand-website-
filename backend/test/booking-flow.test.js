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

test("guest can create a booking request and see a REQ reference", async () => {
  const client = createClient(baseUrl);
  const res = await client.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "Guest One",
      phone: "9876543210",
      email: "guest1@example.com",
      checkIn: isoDate(5),
      checkOut: isoDate(7),
      adults: 2,
      children: 0,
      children13Plus: 0,
      childrenBelow13: 0,
      totalGuests: 2,
    },
    { csrf: true }
  );
  assert.equal(res.status, 201, JSON.stringify(res.data));
  const booking = res.data.booking;
  assert.match(booking.requestReference, /^REQ-\d{4}$/);
  assert.equal(booking.bookingId, booking.requestReference);
  assert.equal(booking.status, "pending_payment");
  assert.equal(booking.paymentStatus, "pending");
  assert.equal(booking.nights, 2);
  assert.equal(booking.roomTotal, 3000);
  assert.equal(booking.grandTotal, 3000);
  assert.equal(booking.taxAmount, 0);
});

test("submitting a UTR moves a booking to payment_verification", async () => {
  const client = createClient(baseUrl);
  const created = await client.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "Guest Two",
      phone: "9876500000",
      email: "guest2@example.com",
      checkIn: isoDate(10),
      checkOut: isoDate(11),
      adults: 1,
      children: 0,
      children13Plus: 0,
      childrenBelow13: 0,
      totalGuests: 1,
    },
    { csrf: true }
  );
  const reference = created.data.booking.requestReference;

  const pay = await client.post(
    `/api/bookings/${reference}/payment`,
    { utr: "UTR123456789" },
    { csrf: true }
  );
  assert.equal(pay.status, 200, JSON.stringify(pay.data));
  assert.equal(pay.data.booking.status, "payment_verification");
  assert.equal(pay.data.booking.paymentStatus, "reference_submitted");
  assert.equal(pay.data.booking.payments.length, 1);
});

test("admin approval assigns a booking ID, room, and verifies payment", async () => {
  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "AC Double Room",
      name: "Guest Three",
      phone: "9812345678",
      email: "guest3@example.com",
      checkIn: isoDate(20),
      checkOut: isoDate(22),
      adults: 3,
      children: 0,
      children13Plus: 1,
      childrenBelow13: 0,
      totalGuests: 4,
      couponCode: "WELCOME50",
    },
    { csrf: true }
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const reference = created.data.booking.requestReference;
  assert.equal(created.data.booking.roomTotal, 3000);
  assert.equal(created.data.booking.extraGuestTotal, 1000);
  assert.equal(created.data.booking.discountAmount, 1500);
  assert.equal(created.data.booking.grandTotal, 2500);

  await guest.post(`/api/bookings/${reference}/payment`, { utr: "UTR987654321" }, { csrf: true });

  const admin = await adminClient();
  const verified = await admin.post(
    `/api/admin/bookings/${reference}/payment/verify`,
    { approve: true },
    { csrf: true }
  );
  assert.equal(verified.status, 200, JSON.stringify(verified.data));
  const approved = await admin.patch(
    `/api/admin/bookings/${reference}/status`,
    { status: "approved" },
    { csrf: true }
  );
  assert.equal(approved.status, 200, JSON.stringify(approved.data));
  const booking = approved.data.booking;
  assert.equal(booking.status, "confirmed");
  assert.match(booking.bookingId, /^SVG-\d{6}$/);
  assert.equal(booking.paymentStatus, "verified");
  assert.ok(booking.assignedRoomNumber, "a physical room should be assigned");
});

test("bookings can only be confirmed, not skipped to checked_in from pending", async () => {
  const admin = await adminClient();
  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "Non-AC Single Room",
      name: "Guest Four",
      phone: "9800000000",
      email: "guest4@example.com",
      checkIn: isoDate(30),
      checkOut: isoDate(31),
      adults: 1,
      children: 0,
      children13Plus: 0,
      childrenBelow13: 0,
      totalGuests: 1,
    },
    { csrf: true }
  );
  const reference = created.data.booking.requestReference;
  const res = await admin.patch(
    `/api/admin/bookings/${reference}/status`,
    { status: "checked_in" },
    { csrf: true }
  );
  assert.equal(res.status, 409);
});
