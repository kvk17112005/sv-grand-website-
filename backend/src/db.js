import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in the backend environment.");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (databaseUrl.searchParams.get("sslmode") === "require") {
  databaseUrl.searchParams.set("sslmode", "verify-full");
}

export const pool = new Pool({ connectionString: databaseUrl.toString() });

export async function withTransaction(run) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* connection may already be broken */
    }
    throw error;
  } finally {
    client.release();
  }
}
