import { pool } from "../db.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";
import { getHotelContext } from "./catalog.js";
import { assignRoom, getBookingById, transitionBooking } from "./bookings.js";
import { pickAvailableRoom } from "./availability.js";

export async function checkInBooking({ bookingId, input = {}, actor }) {
  const booking = await getBookingById(pool, bookingId);

  if (!["confirmed", "checked_in"].includes(booking.status)) {
    throw conflict(`Cannot check in a booking that is ${booking.status}.`);
  }

  let assignedRoomId = booking.assignedRoomId ?? null;

  if (input.roomNumber) {
    const { hotel } = await getHotelContext();
    const roomResult = await pool.query(
      `SELECT id, room_type_id AS "roomTypeId" FROM physical_rooms
        WHERE hotel_id = $1 AND room_number = $2 AND is_active = true`,
      [hotel.id, String(input.roomNumber).trim()]
    );
    if (roomResult.rowCount === 0) throw notFound("Room not found.");
    const room = roomResult.rows[0];
    if (room.roomTypeId !== booking.roomTypeId) throw badRequest("Room type mismatch.");
    assignedRoomId = room.id;
  }

  if (!assignedRoomId) {
    const picked = await pickAvailableRoom(pool, booking.roomTypeId, booking.checkIn, booking.checkOut);
    if (!picked) throw conflict("No available room of this type.");
    assignedRoomId = picked.id;
  }

  if (assignedRoomId !== booking.assignedRoomId) {
    await assignRoom({ id: bookingId, roomId: assignedRoomId, actor });
  }

  const updated =
    booking.status === "checked_in"
      ? booking
      : await transitionBooking({ id: bookingId, toStatus: "checked_in", actor });

  await pool.query(
    `UPDATE physical_rooms SET operational_status = 'occupied', updated_at = now() WHERE id = $1`,
    [assignedRoomId]
  );

  if (input.collectPayment) {
    return collectPayment({
      bookingId,
      input: { method: input.paymentMethod, amount: undefined },
      actor,
    });
  }

  return updated;
}

export async function checkOutBooking({ bookingId, actor }) {
  const updated = await transitionBooking({ id: bookingId, toStatus: "checked_out", actor });
  if (updated.assignedRoomId) {
    await pool.query(
      `UPDATE physical_rooms
          SET operational_status = 'cleaning', housekeeping_status = 'dirty', updated_at = now()
        WHERE id = $1`,
      [updated.assignedRoomId]
    );
  }
  return updated;
}

export async function collectPayment({ bookingId, input = {}, actor }) {
  const booking = await getBookingById(pool, bookingId);
  if (booking.paymentStatus === "verified") throw conflict("Payment already verified.");

  const method = input.method === "upi" ? "upi" : "pay_at_hotel";
  const amount = Number(input.amount ?? booking.grandTotal ?? 0);

  await pool.query(
    `INSERT INTO payments (booking_id, method, amount, status, verified_by, verified_at, submitted_at)
     VALUES ($1, $2, $3, 'verified', $4, now(), now())`,
    [bookingId, method, amount, actor?.id ?? null]
  );
  await pool.query(
    `UPDATE bookings SET payment_status = 'verified', updated_at = now() WHERE id = $1`,
    [bookingId]
  );

  return getBookingById(pool, bookingId);
}
