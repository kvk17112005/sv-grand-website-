import { pool, withTransaction } from "../db.js";
import { getHotelContext } from "./catalog.js";
import { notFound } from "../lib/errors.js";
import { getBookingById } from "./bookings.js";

function serializeGuestRequest(row) {
  return {
    id: row.id,
    bookingId: row.bookingId ?? null,
    roomId: row.roomId ?? null,
    roomNumber: row.roomNumber ?? null,
    guestName: row.guestName ?? row.bookingGuestName ?? null,
    category: row.category,
    type: row.category,
    title: row.title,
    notes: row.notes ?? null,
    priority: row.priority,
    status: row.status,
    assignedTo: row.assignedTo ?? null,
    assignedStaffId: row.assignedStaffId ?? null,
    createdAt: row.createdAt,
  };
}

const GR_SELECT = `
  SELECT gr.id, gr.booking_id AS "bookingId", gr.room_id AS "roomId", p.room_number AS "roomNumber",
         gr.guest_name AS "guestName", b.guest_name AS "bookingGuestName",
         gr.category, gr.title, gr.notes, gr.priority, gr.status,
         s.name AS "assignedTo", gr.assigned_staff_id AS "assignedStaffId",
         gr.created_at AS "createdAt"
    FROM guest_requests gr
    LEFT JOIN bookings b ON b.id = gr.booking_id
    LEFT JOIN physical_rooms p ON p.id = gr.room_id
    LEFT JOIN staff s ON s.id = gr.assigned_staff_id
`;

export async function listGuestRequests() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `${GR_SELECT} WHERE gr.hotel_id = $1 ORDER BY gr.created_at DESC`,
    [hotel.id]
  );
  return result.rows.map(serializeGuestRequest);
}

export async function createGuestRequest({ input, actor }) {
  const { hotel } = await getHotelContext();
  return withTransaction(async (client) => {
    let bookingId = null;
    let roomId = null;
    let guestName = input.guestName ? String(input.guestName).trim() : null;

    if (input.bookingReference) {
      const bres = await client.query(
        `SELECT id, guest_name AS "guestName", assigned_room_id AS "assignedRoomId"
           FROM bookings
          WHERE upper(request_reference)=upper($1) OR upper(booking_id)=upper($1) OR replace(upper(booking_id),'-','')=replace(upper($1),'-','')
          LIMIT 1`,
        [input.bookingReference]
      );
      if (bres.rowCount > 0) {
        bookingId = bres.rows[0].id;
        if (!guestName) guestName = bres.rows[0].guestName;
        roomId = bres.rows[0].assignedRoomId ?? null;
      }
    } else if (input.bookingId) {
      const bres = await client.query(
        `SELECT id, guest_name AS "guestName", assigned_room_id AS "assignedRoomId" FROM bookings WHERE id=$1`,
        [input.bookingId]
      );
      if (bres.rowCount > 0) {
        bookingId = bres.rows[0].id;
        if (!guestName) guestName = bres.rows[0].guestName;
        roomId = bres.rows[0].assignedRoomId ?? null;
      }
    }

    if (input.roomNumber && !roomId) {
      const rres = await client.query(
        `SELECT id FROM physical_rooms WHERE hotel_id=$1 AND room_number=$2`,
        [hotel.id, String(input.roomNumber).trim()]
      );
      if (rres.rowCount > 0) roomId = rres.rows[0].id;
    }

    const category = input.category || "other";
    const title = String(input.title).trim();
    const notes = input.notes ? String(input.notes).slice(0, 1000) : null;
    const priority = input.priority || "normal";
    const status = "pending";

    const ins = await client.query(
      `INSERT INTO guest_requests (hotel_id, booking_id, room_id, guest_name, category, title, notes, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [hotel.id, bookingId, roomId, guestName, category, title, notes, priority, status]
    );

    const res = await client.query(`${GR_SELECT} WHERE gr.id=$1`, [ins.rows[0].id]);
    return serializeGuestRequest(res.rows[0]);
  });
}

export async function updateGuestRequest({ id, input, actor }) {
  return withTransaction(async (client) => {
    const cur = await client.query(
      `SELECT id, status, assigned_staff_id FROM guest_requests WHERE id=$1 FOR UPDATE`,
      [id]
    );
    if (cur.rowCount === 0) throw notFound("Guest request not found.");
    const current = cur.rows[0];

    const status = input.status ?? current.status;
    const priority = input.priority ?? null;
    const notes = input.notes !== undefined ? input.notes : null;
    let assignedStaffId = input.assignedStaffId !== undefined ? input.assignedStaffId : current.assigned_staff_id;

    if (input.assignedTo && !input.assignedStaffId) {
      const s = await client.query(`SELECT id FROM staff WHERE lower(name)=lower($1) LIMIT 1`, [
        String(input.assignedTo).trim(),
      ]);
      if (s.rowCount > 0) assignedStaffId = s.rows[0].id;
    }
    if (assignedStaffId === null && input.assignedTo === null) assignedStaffId = null;

    await client.query(
      `UPDATE guest_requests
          SET status = coalesce($2, status),
              priority = coalesce($3, priority),
              assigned_staff_id = $4,
              notes = coalesce($5, notes),
              updated_at = now()
        WHERE id = $1`,
      [id, status, priority, assignedStaffId, notes]
    );

    if (status !== current.status) {
      await client.query(
        `INSERT INTO guest_request_updates (request_id, status, note, actor_user_id)
         VALUES ($1, $2, $3, $4)`,
        [id, status, notes, actor?.id ?? null]
      );
    }

    const res = await client.query(`${GR_SELECT} WHERE gr.id=$1`, [id]);
    return serializeGuestRequest(res.rows[0]);
  });
}
