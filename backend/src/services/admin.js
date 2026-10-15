import { pool } from "../db.js";
import { BOOKING_SELECT } from "../lib/serializers.js";
import { hydrateMany } from "./bookings.js";

export async function getOverview() {
  const statsResult = await pool.query(
    `SELECT count(*)::int AS bookings,
            (SELECT count(*)::int FROM users WHERE role = 'customer') AS customers,
            count(*) FILTER (WHERE check_in >= CURRENT_DATE AND status NOT IN ('cancelled','no_show'))::int AS "upcomingBookings",
            count(*) FILTER (WHERE status = 'payment_verification')::int AS "pendingVerification",
            coalesce(sum(grand_total) FILTER (WHERE status IN ('confirmed','checked_in','checked_out')), 0)::numeric AS revenue
       FROM bookings`
  );

  const bookingsResult = await pool.query(
    `${BOOKING_SELECT} ORDER BY b.created_at DESC LIMIT 200`
  );
  const bookings = await hydrateMany(bookingsResult.rows);

  const customersResult = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.status,
            count(b.id)::int AS "bookingCount",
            u.created_at AS "createdAt"
       FROM users u
       LEFT JOIN bookings b ON b.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 200`
  );

  const stats = statsResult.rows[0];
  stats.revenue = Number(stats.revenue);

  return { stats, bookings, customers: customersResult.rows };
}

export async function getStaff() {
  const result = await pool.query(
    `SELECT id, name, email, role, status, created_at AS "createdAt"
       FROM users
      WHERE role IN ('admin', 'super_admin')
      ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function findBookingForVerification(code) {
  const clean = String(code || "").trim();
  if (!clean) return null;
  const noHyphen = clean.replace(/[^A-Za-z0-9]/g, "");
  const result = await pool.query(
    `${BOOKING_SELECT}
      WHERE upper(b.request_reference) = upper($1)
         OR upper(b.booking_id) = upper($1)
         OR upper(replace(coalesce(b.booking_id,''), '-', '')) = upper($2)
         OR upper(replace(coalesce(b.request_reference,''), '-', '')) = upper($2)
         OR b.guest_phone LIKE '%' || $1 || '%'
         OR b.booking_id ILIKE '%' || $1 || '%'
         OR b.guest_name ILIKE '%' || $1 || '%'
      ORDER BY b.created_at DESC
      LIMIT 1`,
    [clean, noHyphen]
  );
  if (result.rowCount === 0) return null;
  const [booking] = await hydrateMany(result.rows);
  return booking;
}
