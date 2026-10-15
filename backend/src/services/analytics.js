import { pool } from "../db.js";
import { getHotelContext } from "./catalog.js";

export async function getAnalytics() {
  const { hotel } = await getHotelContext();
  const today = new Date().toISOString().slice(0, 10);

  const totals = await pool.query(
    `SELECT
       count(*)::int AS totalBookings,
       count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
       count(*) FILTER (WHERE status = 'no_show')::int AS noShow,
       coalesce(sum(grand_total) FILTER (WHERE status IN ('confirmed','checked_in','checked_out')), 0)::numeric AS grossRevenue,
       coalesce(sum(nights) FILTER (WHERE status IN ('confirmed','checked_in','checked_out')), 0)::int AS nightsBooked
     FROM bookings
    WHERE hotel_id = $1`,
    [hotel.id]
  ).then((r) => r.rows[0]);

  const refundsRow = await pool.query(
    `SELECT coalesce(sum(rf.amount) FILTER (WHERE rf.status = 'processed'), 0)::numeric AS refunds
       FROM refunds rf
       JOIN bookings b ON b.id = rf.booking_id
      WHERE b.hotel_id = $1`,
    [hotel.id]
  ).then((r) => r.rows[0]);

  const totalRooms = await pool.query(
    `SELECT count(*)::int AS total FROM physical_rooms WHERE hotel_id = $1 AND is_active = true`,
    [hotel.id]
  ).then((r) => r.rows[0]?.total || 0);

  const occupiedRooms = await pool.query(
    `SELECT count(*)::int AS total
       FROM physical_rooms
      WHERE hotel_id = $1 AND is_active = true AND operational_status = 'occupied'`,
    [hotel.id]
  ).then((r) => r.rows[0]?.total || 0);

  const revenue = Number(totals.grossRevenue || 0);
  const refunds = Number(refundsRow.refunds || 0);
  const nightsBooked = Number(totals.nightsBooked || 0);
  const totalBookings = Number(totals.totalBookings || 0);
  const adr = nightsBooked > 0 ? revenue / nightsBooked : 0;
  const occupancy = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  const revPar = totalRooms > 0 ? revenue / totalRooms : 0;

  const paymentBreakdown = await pool.query(
    `SELECT p.method AS "paymentMethod", count(*)::int AS count
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
      WHERE b.hotel_id = $1
      GROUP BY p.method
      ORDER BY count DESC`,
    [hotel.id]
  ).then((r) => r.rows.map((x) => ({ method: x.paymentMethod || "upi", count: x.count })));

  const monthly = await pool.query(
    `SELECT to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
            coalesce(sum(grand_total) FILTER (WHERE status IN ('confirmed','checked_in','checked_out')), 0)::numeric AS revenue
       FROM bookings
      WHERE hotel_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE) - interval '5 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)`,
    [hotel.id]
  ).then((r) => r.rows.map((x) => ({ month: x.month, revenue: Number(x.revenue) })));

  return {
    totalBookings,
    cancelled: Number(totals.cancelled || 0),
    noShow: Number(totals.noShow || 0),
    grossRevenue: revenue,
    netRevenue: Math.max(0, revenue - refunds),
    refunds,
    nightsBooked,
    adr,
    occupancyRate: occupancy,
    revPar,
    occupiedRooms,
    totalRooms,
    paymentBreakdown,
    monthlyRevenue: monthly,
  };
}
