import { pool, withTransaction } from "../db.js";
import { getHotelContext } from "./catalog.js";
import { notFound } from "../lib/errors.js";

const RATE_SELECT = `
  SELECT rt.id, rt.code, rt.name, rt.discount_percentage::float AS "discountPercentage",
         coalesce((
           SELECT json_agg(json_build_object('stayDuration', r.stay_duration, 'amount', r.amount::float)
                           ORDER BY r.stay_duration)
             FROM room_type_rates r
            WHERE r.room_type_id = rt.id
              AND r.effective_from <= CURRENT_DATE
              AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
         ), '[]'::json) AS rates
    FROM room_types rt
`;

export async function listRoomTypePricing() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `${RATE_SELECT} WHERE rt.hotel_id = $1 AND rt.is_active = true ORDER BY rt.display_order`,
    [hotel.id]
  );
  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    discountPercentage: row.discountPercentage,
    rates: row.rates,
    basePrice:
      (row.rates || []).find((r) => r.stayDuration === 24)?.amount ??
      (row.rates || []).find((r) => r.stayDuration === 12)?.amount ??
      null,
  }));
}

async function setRate(client, roomTypeId, stayDuration, amount) {
  if (amount === undefined || amount === null) return;
  await client.query(
    `DELETE FROM room_type_rates
      WHERE room_type_id = $1 AND stay_duration = $2
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)`,
    [roomTypeId, stayDuration]
  );
  await client.query(
    `INSERT INTO room_type_rates (room_type_id, stay_duration, amount, effective_from)
     VALUES ($1, $2, $3, CURRENT_DATE)`,
    [roomTypeId, stayDuration, amount]
  );
}

export async function updateRoomTypePricing({ roomTypeId, input, actor }) {
  const { hotel } = await getHotelContext();
  return withTransaction(async (client) => {
    const rt = await client.query(
      `SELECT id FROM room_types WHERE id = $1 AND hotel_id = $2`,
      [roomTypeId, hotel.id]
    );
    if (rt.rowCount === 0) throw notFound("Room type not found.");

    if (input.discountPercentage !== undefined) {
      await client.query(
        `UPDATE room_types SET discount_percentage = $2, updated_at = now() WHERE id = $1`,
        [roomTypeId, input.discountPercentage]
      );
    }

    await setRate(client, roomTypeId, 12, input.twelveHourRate);
    await setRate(client, roomTypeId, 24, input.twentyFourHourRate);

    const result = await client.query(`${RATE_SELECT} WHERE rt.id = $1`, [roomTypeId]);
    const row = result.rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      discountPercentage: row.discountPercentage,
      rates: row.rates,
      basePrice:
        (row.rates || []).find((r) => r.stayDuration === 24)?.amount ??
        (row.rates || []).find((r) => r.stayDuration === 12)?.amount ??
        null,
    };
  });
}
