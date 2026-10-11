import { pool } from "./db.js";

const [emailArg, roleArg] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();
const role = roleArg?.trim();

if (!email || !["admin", "super_admin"].includes(role)) {
  console.error("Usage: npm run admin:promote -- <email> <admin|super_admin>");
  process.exitCode = 1;
} else {
  try {
    const result = await pool.query(
      `UPDATE users
       SET role = $1, updated_at = now()
       WHERE email = $2
       RETURNING email, role`,
      [role, email]
    );

    if (result.rowCount !== 1) {
      throw new Error(`No registered account found for ${email}.`);
    }

    console.info(`Updated ${result.rows[0].email} to ${result.rows[0].role}.`);
  } catch (error) {
    console.error("Could not update staff role:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
