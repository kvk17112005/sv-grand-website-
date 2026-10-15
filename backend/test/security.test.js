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

test("CORS preflight allows PATCH", async () => {
  const response = await fetch(`${baseUrl}/api/admin/bookings/x/status`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5173",
      "Access-Control-Request-Method": "PATCH",
      "Access-Control-Request-Headers": "content-type,x-csrf-token",
    },
  });
  const allowMethods = response.headers.get("access-control-allow-methods") || "";
  assert.match(allowMethods, /PATCH/);
});

test("admin overview requires authentication", async () => {
  const client = createClient(baseUrl);
  const res = await client.get("/api/admin/overview");
  assert.equal(res.status, 401);
});

test("admin booking verification requires authentication", async () => {
  const client = createClient(baseUrl);
  const res = await client.get("/api/admin/bookings/verify/SVG-123");
  assert.equal(res.status, 401);
});

test("admin status update requires authentication", async () => {
  const client = createClient(baseUrl);
  const res = await client.patch("/api/admin/bookings/abc/status", { status: "confirmed" });
  assert.equal(res.status, 401);
});

test("unauthenticated booking list never leaks by email", async () => {
  const client = createClient(baseUrl);
  const res = await client.get("/api/bookings?email=admin@svgrand.com");
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.bookings, []);
});

test("write requests without a CSRF token are rejected", async () => {
  const client = createClient(baseUrl);
  const res = await client.post("/api/bookings", {
    roomName: "AC Single Room",
    name: "No CSRF",
    phone: "9876543210",
    email: "nocsrf@example.com",
    checkIn: "2026-12-01",
    checkOut: "2026-12-02",
    adults: 1,
    totalGuests: 1,
  });
  assert.equal(res.status, 403);
});

test("customer accounts cannot access admin endpoints", async () => {
  await createUser({ name: "Customer", email: "cust@example.com", role: "customer" });
  const client = createClient(baseUrl);
  const login = await client.post(
    "/api/auth/login",
    { email: "cust@example.com", password: "Password@123" },
    { csrf: true }
  );
  assert.equal(login.status, 200);
  const res = await client.get("/api/admin/overview");
  assert.equal(res.status, 403);
});
