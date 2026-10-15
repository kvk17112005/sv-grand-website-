let server;
let baseUrl;

export async function startTestServer() {
  const { createApp } = await import("../../src/app.js");
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
  return baseUrl;
}

export async function stopTestServer() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = undefined;
  }
  const { pool } = await import("../../src/db.js");
  await pool.end();
}
