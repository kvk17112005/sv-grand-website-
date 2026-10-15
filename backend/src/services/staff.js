import { pool, withTransaction } from "../db.js";
import { getHotelContext } from "./catalog.js";
import { notFound } from "../lib/errors.js";

function serializeStaff(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.jobTitle,
    jobTitle: row.jobTitle,
    phone: row.phone ?? null,
    email: row.email ?? null,
    shift: row.shift ?? null,
    status: row.status,
    joinedDate: row.joinedDate,
  };
}

export async function listStaff() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `SELECT id, name, job_title AS "jobTitle", phone, email, shift, status, joined_date AS "joinedDate"
       FROM staff
      WHERE hotel_id = $1
      ORDER BY created_at DESC`,
    [hotel.id]
  );
  return result.rows.map(serializeStaff);
}

export async function createStaff({ input }) {
  const { hotel } = await getHotelContext();
  return withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO staff (hotel_id, name, job_title, phone, email, shift, status, joined_date)
       VALUES ($1, $2, $3, $4, $5, $6, coalesce($7, 'active'), CURRENT_DATE)
       RETURNING id, name, job_title AS "jobTitle", phone, email, shift, status, joined_date AS "joinedDate"`,
      [
        hotel.id,
        String(input.name).trim(),
        String(input.jobTitle || input.role || "").trim(),
        input.phone ? String(input.phone).trim() : null,
        input.email ? String(input.email).trim().toLowerCase() : null,
        input.shift ? String(input.shift).trim() : null,
        input.status ?? null,
      ]
    );
    return serializeStaff(ins.rows[0]);
  });
}

export async function updateStaff({ id, input }) {
  return withTransaction(async (client) => {
    const cur = await client.query(`SELECT id FROM staff WHERE id=$1`, [id]);
    if (cur.rowCount === 0) throw notFound("Staff member not found.");

    await client.query(
      `UPDATE staff
          SET name = coalesce($2, name),
              job_title = coalesce($3, job_title),
              phone = coalesce($4, phone),
              email = coalesce($5, email),
              shift = coalesce($6, shift),
              status = coalesce($7, status),
              updated_at = now()
        WHERE id = $1`,
      [
        id,
        input.name ? String(input.name).trim() : null,
        input.jobTitle || input.role ? String(input.jobTitle || input.role).trim() : null,
        input.phone !== undefined ? String(input.phone).trim() || null : null,
        input.email !== undefined ? String(input.email).trim().toLowerCase() || null : null,
        input.shift !== undefined ? String(input.shift).trim() || null : null,
        input.status ?? null,
      ]
    );
    const res = await client.query(
      `SELECT id, name, job_title AS "jobTitle", phone, email, shift, status, joined_date AS "joinedDate" FROM staff WHERE id=$1`,
      [id]
    );
    return serializeStaff(res.rows[0]);
  });
}

export async function removeStaff({ id }) {
  await pool.query(`DELETE FROM staff WHERE id = $1`, [id]);
  return { id };
}
