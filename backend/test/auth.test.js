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

test("register then session then logout flow", async () => {
  const client = createClient(baseUrl);

  const anon = await client.get("/api/auth/session");
  assert.equal(anon.status, 200);
  assert.equal(anon.data.user, null);

  const registered = await client.post(
    "/api/auth/register",
    {
      name: "New Customer",
      email: "newcustomer@example.com",
      phone: "9876501234",
      password: "StrongPassword123",
    },
    { csrf: true }
  );
  assert.equal(registered.status, 201, JSON.stringify(registered.data));
  assert.equal(registered.data.user.email, "newcustomer@example.com");
  assert.ok(!("password" in registered.data.user));
  assert.ok(!("password_hash" in registered.data.user));

  const session = await client.get("/api/auth/session");
  assert.equal(session.data.user.email, "newcustomer@example.com");

  const logout = await client.post("/api/auth/logout", undefined, { csrf: true });
  assert.equal(logout.status, 204);

  const afterLogout = await client.get("/api/auth/session");
  assert.equal(afterLogout.data.user, null);
});

test("duplicate email registration is rejected", async () => {
  const client = createClient(baseUrl);
  const body = {
    name: "Dup",
    email: "dup@example.com",
    phone: "9876501111",
    password: "StrongPassword123",
  };
  const first = await client.post("/api/auth/register", body, { csrf: true });
  assert.equal(first.status, 201);
  const second = createClient(baseUrl);
  const dup = await second.post("/api/auth/register", body, { csrf: true });
  assert.equal(dup.status, 409);
});

test("login with wrong password fails", async () => {
  const client = createClient(baseUrl);
  await client.post(
    "/api/auth/register",
    { name: "Login User", email: "login@example.com", phone: "9876502222", password: "StrongPassword123" },
    { csrf: true }
  );
  const attempt = createClient(baseUrl);
  const res = await attempt.post(
    "/api/auth/login",
    { email: "login@example.com", password: "wrong-password" },
    { csrf: true }
  );
  assert.equal(res.status, 401);
});
