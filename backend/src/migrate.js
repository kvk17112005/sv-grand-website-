import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));
const LOCK_KEY = 841142009337;

const connectionString =
  process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Set MIGRATION_DATABASE_URL (direct, non-pooler) or DATABASE_URL before migrating."
  );
  process.exitCode = 1;
} else {
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();

    // Hold a session-level advisory lock so concurrent runners cannot race.
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await client.query("SELECT version FROM schema_migrations")).rows.map((r) => r.version)
    );

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      if (applied.has(version)) {
        console.info(`skip   ${version} (already applied)`);
        continue;
      }

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
        await client.query("COMMIT");
        appliedCount += 1;
        console.info(`apply  ${version}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${error.message}`);
      }
    }

    console.info(
      appliedCount === 0
        ? "Database is up to date. No migrations applied."
        : `Applied ${appliedCount} migration(s).`
    );
  } catch (error) {
    console.error("Database migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]);
    } catch {
      /* connection may already be broken */
    }
    await client.end().catch(() => {});
  }
}
