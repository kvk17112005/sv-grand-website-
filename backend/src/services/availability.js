import { pool } from "../db.js";
import { badRequest } from "../lib/errors.js";
import { ROOM_NAME_TO_CODE } from "../lib/constants.js";
import { computeNights } from "../lib/pricing.js";

const HOLDING = ["pending_payment", "payment_verification"];

export function resolveRoomTypeCode({ roomTypeCode, roomName }) {
  if (roomTypeCode) return String(roomTypeCode).trim().toLowerCase();
  if (roomName && ROOM_NAME_TO_CODE[roomName]) return ROOM_NAME_TO_CODE[roomName];
  // tolerate partial names
  if (roomName) {
    const lower = String(roomName).toLowerCase();
    const isNonAc = lower.includes("non-ac") || lower.includes("non ac");
    const isSingle = lower.includes("single");
    if (isNonAc) return isSingle ? "single_non_ac" : "double_non_ac";
    return isSingle ? "single_ac" : "double_ac";
  }
  return null;
}

export async function getRoomTypeByCode(db, hotelId, code) {
  const result = await db.query(
    `SELECT rt.id, rt.code, rt.name, rt.is_ac AS "isAc", rt.bedroom_type AS "bedroomType",
            rt.max_guests AS "maxGuests", rt.max_adults AS "maxAdults", rt.max_children AS "maxChildren"
       FROM room_types rt
      WHERE rt.hotel_id = $1 AND rt.code = $2 AND rt.is_active = true`,
    [hotelId, code]
  );
  if (result.rowCount === 0) throw badRequest(`Unknown room type: ${code}`);
  return result.rows[0];
}

export async function getRoomTypeRates(db, roomTypeId) {
  const result = await db.query(
    `SELECT stay_duration AS "stayDuration", amount
       FROM room_type_rates
      WHERE room_type_id = $1
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
      ORDER BY effective_from DESC, stay_duration`,
    [roomTypeId]
  );
  const rates = { 12: null, 24: null };
  for (const row of result.rows) {
    if (rates[row.stayDuration] === null) rates[row.stayDuration] = Number(row.amount);
  }
  if (rates[24] === null) throw badRequest("This room type has no published rate.");
  if (rates[12] === null) rates[12] = Math.round(rates[24] * 0.7);
  return rates;
}

export async function countReserved(db, roomTypeId, checkIn, checkOut, excludeBookingId = null) {
  const result = await db.query(
    `SELECT coalesce(sum(br.quantity), 0)::int AS reserved
       FROM booking_rooms br
       JOIN bookings b ON b.id = br.booking_id
      WHERE br.room_type_id = $1
        AND br.stay && daterange($2::date, $3::date, '[)')
        AND ($4::uuid IS NULL OR b.id <> $4::uuid)
        AND (
          b.status IN ('confirmed', 'checked_in')
          OR (b.status = ANY($5) AND (b.hold_expires_at IS NULL OR b.hold_expires_at > now()))
        )`,
    [roomTypeId, checkIn, checkOut, excludeBookingId, HOLDING]
  );
  return result.rows[0].reserved;
}

export async function countTotalRooms(db, roomTypeId) {
  const result = await db.query(
    `SELECT count(*)::int AS total FROM physical_rooms
      WHERE room_type_id = $1 AND is_active = true`,
    [roomTypeId]
  );
  return result.rows[0].total;
}

export async function getAvailability(hotelId, checkIn, checkOut, excludeBookingId = null) {
  const nights = computeNights(checkIn, checkOut);
  if (!Number.isInteger(nights) || nights <= 0) {
    throw badRequest("Check-out must be after check-in.");
  }
  const result = await pool.query(
    `SELECT rt.id, rt.code, rt.name,
            (SELECT count(*)::int FROM physical_rooms p
              WHERE p.room_type_id = rt.id AND p.is_active = true) AS total,
            coalesce((
              SELECT sum(br.quantity)::int
                FROM booking_rooms br
                JOIN bookings b ON b.id = br.booking_id
               WHERE br.room_type_id = rt.id
                 AND br.stay && daterange($2::date, $3::date, '[)')
                 AND ($4::uuid IS NULL OR b.id <> $4::uuid)
                 AND (
                   b.status IN ('confirmed','checked_in')
                   OR (b.status = ANY($5) AND (b.hold_expires_at IS NULL OR b.hold_expires_at > now()))
                 )
            ), 0) AS reserved
       FROM room_types rt
      WHERE rt.hotel_id = $1 AND rt.is_active = true
      ORDER BY rt.display_order`,
    [hotelId, checkIn, checkOut, excludeBookingId, HOLDING]
  );
  return result.rows.map((row) => ({
    roomTypeId: row.id,
    code: row.code,
    name: row.name,
    total: row.total,
    reserved: row.reserved,
    available: Math.max(0, row.total - row.reserved),
  }));
}

export async function getAvailabilityForRoomType(
  hotelId,
  roomTypeId,
  checkIn,
  checkOut,
  excludeBookingId = null
) {
  const [total, reserved] = await Promise.all([
    countTotalRooms(pool, roomTypeId),
    countReserved(pool, roomTypeId, checkIn, checkOut, excludeBookingId),
  ]);
  return { total, reserved, available: Math.max(0, total - reserved) };
}

/**
 * Pick a free physical room of the given type for the stay that does not
 * overlap any active assignment. Returns null when none are free.
 */
export async function pickAvailableRoom(db, roomTypeId, checkIn, checkOut) {
  const result = await db.query(
    `SELECT p.id, p.room_number AS "roomNumber"
       FROM physical_rooms p
      WHERE p.room_type_id = $1 AND p.is_active = true
        AND p.operational_status NOT IN ('maintenance', 'out_of_service')
        AND NOT EXISTS (
          SELECT 1 FROM booking_rooms br
           WHERE br.physical_room_id = p.id
             AND br.is_active = true
             AND br.stay && daterange($2::date, $3::date, '[)')
        )
      ORDER BY p.floor, p.room_number
      LIMIT 1`,
    [roomTypeId, checkIn, checkOut]
  );
  return result.rows[0] || null;
}

export function assertNotInPast(checkIn) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (checkIn < yesterday) {
    throw badRequest("Check-in date cannot be in the past.");
  }
  return today;
}
