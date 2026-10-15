import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createUser, resetAndMigrate } from "./support/db.js";
import { startTestServer, stopTestServer } from "./support/app.js";
import { createClient } from "./support/client.js";

let baseUrl;

before(async () => {
  await resetAndMigrate();
  await createUser({ name: "Front Desk", email: "admin@svgrand.com", role: "admin" });
  baseUrl = await startTestServer();
});

after(async () => {
  await stopTestServer();
});

function payload(email, checkIn, checkOut) {
  return {
    roomName: "AC Single Room",
    name: "Guest",
    phone: "9876500000",
    email,
    checkIn,
    checkOut,
    adults: 1,
    children: 0,
    children13Plus: 0,
    childrenBelow13: 0,
    totalGuests: 1,
  };
}

test("a room type cannot be overbooked beyond its physical rooms", async () => {
  const checkIn = "2027-01-10";
  const checkOut = "2027-01-12";
  const references = [];

  for (let i = 0; i < 3; i += 1) {
    const client = createClient(baseUrl);
    const res = await client.post(
      "/api/bookings",
      payload(`over${i}@example.com`, checkIn, checkOut),
      { csrf: true }
    );
    assert.equal(res.status, 201, JSON.stringify(res.data));
    references.push(res.data.booking.requestReference);
  }

  const fourth = createClient(baseUrl);
  const res = await fourth.post(
    "/api/bookings",
    payload("over4@example.com", checkIn, checkOut),
    { csrf: true }
  );
  assert.equal(res.status, 409);

  // Availability now reports zero for the overlapping range.
  const check = createClient(baseUrl);
  const avail = await check.get(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
  const single = avail.data.availability.find((a) => a.code === "single_ac");
  assert.equal(single.available, 0);

  // Non-overlapping dates remain fully available.
  const other = await check.get("/api/availability?checkIn=2027-02-10&checkOut=2027-02-12");
  const singleOther = other.data.availability.find((a) => a.code === "single_ac");
  assert.equal(singleOther.available, 3);
});

test("cancelling a booking releases its held inventory", async () => {
  const admin = createClient(baseUrl);
  await admin.post(
    "/api/auth/login",
    { email: "admin@svgrand.com", password: "Password@123" },
    { csrf: true }
  );

  const checkIn = "2027-03-10";
  const checkOut = "2027-03-11";
  const guest = createClient(baseUrl);
  const created = await guest.post(
    "/api/bookings",
    payload("cancel@example.com", checkIn, checkOut),
    { csrf: true }
  );
  const reference = created.data.booking.requestReference;

  const before = await guest.get(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
  assert.equal(before.data.availability.find((a) => a.code === "single_ac").available, 2);

  const cancelled = await admin.patch(
    `/api/admin/bookings/${reference}/status`,
    { status: "cancelled", reason: "Guest changed plans" },
    { csrf: true }
  );
  assert.equal(cancelled.status, 200, JSON.stringify(cancelled.data));
  assert.equal(cancelled.data.booking.status, "cancelled");

  const afterCancel = await guest.get(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
  assert.equal(afterCancel.data.availability.find((a) => a.code === "single_ac").available, 3);
});
