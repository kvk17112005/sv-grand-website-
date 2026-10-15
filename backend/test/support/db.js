import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const MIGRATIONS_DIR = fileURLToPath(new URL("../../migrations", import.meta.url));

export function testConnectionString() {
  const url = new URL(process.env.DATABASE_URL_TEST);
  url.hostname = url.hostname.replace("-pooler", "");
  return url.toString();
}

export async function resetAndMigrate() {
  const client = new pg.Client({ connectionString: testConnectionString() });
  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
}

export async function createUser({ name, email, phone = "9999999999", password = "Password@123", role = "customer", status = "active" }) {
  const { pool } = await import("../../src/db.js");
  const hash = await bcrypt.hash(password, 4);
  const result = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, email.toLowerCase(), phone, hash, role, status]
  );
  return result.rows[0].id;
}
