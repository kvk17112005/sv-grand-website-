import { pool, withTransaction } from "../db.js";
import { getHotelContext } from "./catalog.js";
import { notFound } from "../lib/errors.js";

const STATUS_TO_HOUSEKEEPING = {
  available: "clean",
  occupied: "clean",
  cleaning: "cleaning",
  maintenance: "dirty",
  out_of_service: "dirty",
};

const ROOM_SELECT = `
  SELECT p.id, p.room_number AS "roomNumber", p.floor,
         p.room_type_id AS "roomTypeId", rt.name AS "roomTypeName", rt.code AS "roomTypeCode",
         p.operational_status AS "operationalStatus",
         p.housekeeping_status AS "housekeepingStatus",
         p.assigned_housekeeper AS "assignedHousekeeper",
         p.notes, p.is_active AS "isActive",
         p.last_cleaned_at AS "lastCleaned"
    FROM physical_rooms p
    JOIN room_types rt ON rt.id = p.room_type_id
`;

export function serializeRoom(row) {
  return {
    id: row.id,
    roomNumber: row.roomNumber,
    floor: row.floor,
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomTypeName,
    roomTypeCode: row.roomTypeCode,
    status: row.operationalStatus,
    operationalStatus: row.operationalStatus,
    housekeepingStatus: row.housekeepingStatus,
    assignedHousekeeper: row.assignedHousekeeper ?? null,
    notes: row.notes ?? null,
    lastCleaned: row.lastCleaned ?? null,
    isActive: row.isActive,
  };
}

export async function listRooms() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(`${ROOM_SELECT} WHERE p.hotel_id = $1 ORDER BY p.floor, p.room_number`, [
    hotel.id,
  ]);
  return result.rows.map(serializeRoom);
}

export async function updateRoomStatus({ roomNumber, input, actor }) {
  const { hotel } = await getHotelContext();
  return withTransaction(async (client) => {
    const roomResult = await client.query(
      `SELECT id, operational_status AS "operationalStatus",
              housekeeping_status AS "housekeepingStatus"
         FROM physical_rooms
        WHERE hotel_id = $1 AND room_number = $2
        FOR UPDATE`,
      [hotel.id, roomNumber]
    );
    if (roomResult.rowCount === 0) throw notFound("Room not found.");
    const room = roomResult.rows[0];

    const operationalStatus = input.operationalStatus ?? room.operationalStatus;
    const housekeepingStatus =
      input.housekeepingStatus ??
      (input.operationalStatus
        ? STATUS_TO_HOUSEKEEPING[input.operationalStatus]
        : room.housekeepingStatus);
    const notes = input.notes !== undefined ? input.notes : null;
    const assignedHousekeeper =
      input.assignedHousekeeper !== undefined ? input.assignedHousekeeper : null;

    await client.query(
      `UPDATE physical_rooms
          SET operational_status = $1,
              housekeeping_status = $2,
              notes = coalesce($3, notes),
              assigned_housekeeper = coalesce($4, assigned_housekeeper),
              last_cleaned_at = CASE WHEN $2 = 'clean' THEN now() ELSE last_cleaned_at END,
              updated_at = now()
        WHERE id = $5`,
      [operationalStatus, housekeepingStatus, notes, assignedHousekeeper, room.id]
    );

    if (operationalStatus !== room.operationalStatus) {
      await client.query(
        `INSERT INTO room_status_history (room_id, from_status, to_status, actor_user_id, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [room.id, room.operationalStatus, operationalStatus, actor?.id ?? null, notes]
      );
    }

    const updated = await client.query(`${ROOM_SELECT} WHERE p.id = $1`, [room.id]);
    return serializeRoom(updated.rows[0]);
  });
}
