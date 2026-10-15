import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { resetAndMigrate } from "./support/db.js";
import { startTestServer, stopTestServer } from "./support/app.js";
import { createClient } from "./support/client.js";

let baseUrl;

before(async () => {
  await resetAndMigrate();
  baseUrl = await startTestServer();
});

after(async () => {
  await stopTestServer();
});

test("health endpoint returns ok", async () => {
  const client = createClient(baseUrl);
  const res = await client.get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.data.status, "ok");
});

test("public catalog exposes hotel, room types, offers, add-ons", async () => {
  const client = createClient(baseUrl);
  const res = await client.get("/api/hotel");
  assert.equal(res.status, 200);
  assert.equal(res.data.hotel.name, "SV Grand Luxury Rooms");
  assert.equal(res.data.roomTypes.length, 4);
  assert.equal(res.data.offers.length, 3);
  assert.equal(res.data.addOns.length, 4);
  assert.equal(res.data.settings.upiId, "3341101017051@cnrb");
  assert.equal(res.data.settings.taxPercentage, 0);
});

test("availability reflects seeded physical rooms", async () => {
  const client = createClient(baseUrl);
  const res = await client.get("/api/availability?checkIn=2026-11-01&checkOut=2026-11-03");
  assert.equal(res.status, 200);
  const byCode = Object.fromEntries(res.data.availability.map((a) => [a.code, a]));
  assert.equal(byCode.single_ac.total, 3);
  assert.equal(byCode.single_non_ac.total, 2);
  assert.equal(byCode.double_ac.total, 4);
  assert.equal(byCode.double_non_ac.total, 3);
  assert.equal(byCode.single_ac.available, 3);
});

test("unknown route returns 404 with message", async () => {
  const client = createClient(baseUrl);
  const res = await client.get("/api/does-not-exist");
  assert.equal(res.status, 404);
});
