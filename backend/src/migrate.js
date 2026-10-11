import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

try {
  const migrationPath = new URL("../migrations/001_initial.sql", import.meta.url);
  const migration = await readFile(fileURLToPath(migrationPath), "utf8");
  await pool.query(migration);
  console.info("Database migration 001_initial applied.");
} catch (error) {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
