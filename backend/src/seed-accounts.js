import bcrypt from "bcryptjs";
import { pool } from "./db.js";

async function seedAccounts() {
  const hash = await bcrypt.hash("Password@123", 12);

  const accounts = [
    {
      name: "Varun Krishna (Guest User)",
      email: "user@svgrand.com",
      phone: "+91 9876543210",
      role: "customer",
    },
    {
      name: "Front Desk Manager (Hotel Admin)",
      email: "hoteladmin@svgrand.com",
      phone: "+91 8558222555",
      role: "admin",
    },
    {
      name: "Super Admin Executive",
      email: "superadmin@svgrand.com",
      phone: "+91 9999900000",
      role: "super_admin",
    },
  ];

  for (const acc of accounts) {
    const res = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name,
                     phone = EXCLUDED.phone,
                     password_hash = EXCLUDED.password_hash,
                     role = EXCLUDED.role,
                     updated_at = now()
       RETURNING id, name, email, role;`,
      [acc.name, acc.email, acc.phone, hash, acc.role]
    );
    console.info("Seeded account:", res.rows[0]);
  }
}

try {
  await seedAccounts();
  console.info("All 3 panel accounts created / updated successfully.");
} catch (error) {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
