import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createUser, resetAndMigrate } from "./support/db.js";
import { startTestServer, stopTestServer } from "./support/app.js";
import { createClient } from "./support/client.js";

const HOTEL_ID = "11111111-1111-1111-1111-111111111111";

let baseUrl;
const sessionCache = new Map();

function isoDate(offsetDays) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

before(async () => {
  await resetAndMigrate();
  await createUser({ name: "Front Desk", email: "admin@svgrand.com", role: "admin" });
  await createUser({ name: "Owner", email: "owner@svgrand.com", role: "super_admin" });
  baseUrl = await startTestServer();
});

after(async () => {
  await stopTestServer();
});

async function loginAs(email) {
  if (sessionCache.has(email)) return sessionCache.get(email);
  const client = createClient(baseUrl);
  const res = await client.post(
    "/api/auth/login",
    { email, password: "Password@123" },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  sessionCache.set(email, client);
  return client;
}

async function createConfirmedBooking({ email, phone, dayOffset }) {
  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "Ops Guest",
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
  await guest.post(`/api/bookings/${reference}/payment`, { utr: `UTR${phone}` }, { csrf: true });

  const admin = await loginAs("admin@svgrand.com");
  const approved = await admin.patch(
    `/api/admin/bookings/${reference}/status`,
    { status: "approved" },
    { csrf: true }
  );
  assert.equal(approved.status, 200, JSON.stringify(approved.data));
  assert.equal(approved.data.booking.status, "confirmed");
  return { reference, booking: approved.data.booking };
}

test("front desk can list rooms and update housekeeping state", async () => {
  const admin = await loginAs("admin@svgrand.com");

  const list = await admin.get("/api/admin/rooms");
  assert.equal(list.status, 200, JSON.stringify(list.data));
  assert.ok(Array.isArray(list.data.rooms) && list.data.rooms.length >= 12);

  const res = await admin.patch(
    "/api/admin/rooms/101/status",
    { operationalStatus: "cleaning", assignedHousekeeper: "Ravi" },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.room.status, "cleaning");
  assert.equal(res.data.room.housekeepingStatus, "cleaning");
  assert.equal(res.data.room.assignedHousekeeper, "Ravi");
});

test("front desk can check a confirmed booking in and out", async () => {
  const admin = await loginAs("admin@svgrand.com");
  const { reference } = await createConfirmedBooking({
    email: "ops1@example.com",
    phone: "9711100001",
    dayOffset: 60,
  });

  const checkedIn = await admin.post(
    `/api/admin/bookings/${reference}/check-in`,
    {},
    { csrf: true }
  );
  assert.equal(checkedIn.status, 200, JSON.stringify(checkedIn.data));
  assert.equal(checkedIn.data.booking.status, "checked_in");

  const roomNumber = checkedIn.data.booking.assignedRoomNumber;
  assert.ok(roomNumber, "a physical room should be assigned");

  const rooms = await admin.get("/api/admin/rooms");
  const room = rooms.data.rooms.find((r) => r.roomNumber === roomNumber);
  assert.equal(room.operationalStatus, "occupied");

  const checkedOut = await admin.post(
    `/api/admin/bookings/${reference}/check-out`,
    {},
    { csrf: true }
  );
  assert.equal(checkedOut.status, 200, JSON.stringify(checkedOut.data));
  assert.equal(checkedOut.data.booking.status, "checked_out");
});

test("front desk can collect an at-desk payment", async () => {
  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    {
      roomName: "AC Single Room",
      name: "Desk Guest",
      phone: "9711100002",
      email: "desk@example.com",
      checkIn: isoDate(70),
      checkOut: isoDate(71),
      adults: 1,
      totalGuests: 1,
    },
    { csrf: true }
  );
  const reference = created.data.booking.requestReference;

  const admin = await loginAs("admin@svgrand.com");
  const res = await admin.post(
    `/api/admin/bookings/${reference}/payment/collect`,
    { method: "pay_at_hotel" },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.booking.paymentStatus, "verified");
  assert.equal(res.data.booking.payments.length, 1);
});

test("guest requests can be raised and progressed", async () => {
  const admin = await loginAs("admin@svgrand.com");
  const created = await admin.post(
    "/api/admin/guest-requests",
    { title: "Extra towels", category: "extra_towels", roomNumber: "101", guestName: "Ops Guest" },
    { csrf: true }
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const id = created.data.guestRequest.id;
  assert.equal(created.data.guestRequest.status, "pending");

  const listed = await admin.get("/api/admin/guest-requests");
  assert.ok(listed.data.guestRequests.some((r) => r.id === id));

  const updated = await admin.patch(
    `/api/admin/guest-requests/${id}`,
    { status: "in_progress" },
    { csrf: true }
  );
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal(updated.data.guestRequest.status, "in_progress");
});

test("only super-admin can manage staff", async () => {
  const admin = await loginAs("admin@svgrand.com");
  const denied = await admin.get("/api/admin/staff");
  assert.equal(denied.status, 403);

  const owner = await loginAs("owner@svgrand.com");
  const created = await owner.post(
    "/api/admin/staff",
    { name: "Ravi Kumar", jobTitle: "Housekeeping", phone: "9800000001", shift: "morning" },
    { csrf: true }
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const id = created.data.staff.id;

  const updated = await owner.patch(
    `/api/admin/staff/${id}`,
    { status: "on_leave" },
    { csrf: true }
  );
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal(updated.data.staff.status, "on_leave");

  const removed = await owner.del(`/api/admin/staff/${id}`, { csrf: true });
  assert.equal(removed.status, 200, JSON.stringify(removed.data));

  const listed = await owner.get("/api/admin/staff");
  assert.ok(!listed.data.staff.some((s) => s.id === id));
});

test("super-admin can manage offers", async () => {
  const owner = await loginAs("owner@svgrand.com");
  const created = await owner.post(
    "/api/admin/offers",
    {
      code: "SUMMER25",
      title: "Summer Special",
      discountType: "percentage",
      discountValue: 25,
      maxDiscount: 1500,
      minBookingAmount: 1000,
    },
    { csrf: true }
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const id = created.data.offer.id;
  assert.equal(created.data.offer.code, "SUMMER25");

  const updated = await owner.patch(
    `/api/admin/offers/${id}`,
    { discountValue: 30 },
    { csrf: true }
  );
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal(updated.data.offer.discountValue, 30);

  const removed = await owner.del(`/api/admin/offers/${id}`, { csrf: true });
  assert.equal(removed.status, 200, JSON.stringify(removed.data));
});

test("super-admin can update room-type pricing", async () => {
  const owner = await loginAs("owner@svgrand.com");
  const list = await owner.get("/api/admin/room-types/pricing");
  assert.equal(list.status, 200, JSON.stringify(list.data));
  const roomType = list.data.roomTypes[0];
  assert.ok(roomType, "at least one room type is seeded");

  const res = await owner.patch(
    `/api/admin/room-types/${roomType.id}/pricing`,
    { twentyFourHourRate: 1999, discountPercentage: 10 },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.roomType.discountPercentage, 10);
  assert.equal(res.data.roomType.basePrice, 1999);
});

test("super-admin can moderate and respond to reviews", async () => {
  const { pool } = await import("../src/db.js");
  const inserted = await pool.query(
    `INSERT INTO reviews (hotel_id, guest_name, rating, comment, status)
     VALUES ($1, 'Test Guest', 4, 'Lovely stay', 'pending') RETURNING id`,
    [HOTEL_ID]
  );
  const id = inserted.rows[0].id;

  const owner = await loginAs("owner@svgrand.com");
  const moderated = await owner.patch(
    `/api/admin/reviews/${id}`,
    { status: "approved" },
    { csrf: true }
  );
  assert.equal(moderated.status, 200, JSON.stringify(moderated.data));
  assert.equal(moderated.data.review.status, "approved");

  const responded = await owner.post(
    `/api/admin/reviews/${id}/response`,
    { text: "Thank you for staying with us!" },
    { csrf: true }
  );
  assert.equal(responded.status, 200, JSON.stringify(responded.data));
  assert.equal(responded.data.review.managerResponse.text, "Thank you for staying with us!");
});

test("super-admin can update hotel settings", async () => {
  const owner = await loginAs("owner@svgrand.com");
  const res = await owner.patch(
    "/api/admin/settings",
    { tagline: "Luxury stays in Tadipatri", checkInTime: "13:00" },
    { csrf: true }
  );
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.settings.hotel.tagline, "Luxury stays in Tadipatri");
});

test("super-admin can read analytics, others cannot", async () => {
  const admin = await loginAs("admin@svgrand.com");
  const denied = await admin.get("/api/admin/analytics");
  assert.equal(denied.status, 403);

  const owner = await loginAs("owner@svgrand.com");
  const res = await owner.get("/api/admin/analytics");
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.ok(typeof res.data.totalBookings === "number");
  assert.ok(Array.isArray(res.data.monthlyRevenue));
});
