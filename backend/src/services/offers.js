import { pool, withTransaction } from "../db.js";
import { getHotelContext } from "./catalog.js";
import { notFound } from "../lib/errors.js";

function serializeOffer(row) {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description ?? null,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    maxDiscount: row.maxDiscount == null ? null : Number(row.maxDiscount),
    minBookingAmount: Number(row.minBookingAmount),
    validFrom: row.validFrom,
    validTo: row.validTo ?? null,
    maxRedemptions: row.maxRedemptions ?? null,
    perCustomerLimit: row.perCustomerLimit,
    active: row.active,
    badge: row.badge ?? null,
    usageCount: Number(row.usageCount || 0),
  };
}

const OFFER_SELECT_ADMIN = `
  SELECT o.id, o.code, o.title, o.description, o.discount_type AS "discountType",
         o.discount_value AS "discountValue", o.max_discount AS "maxDiscount",
         o.min_booking_amount AS "minBookingAmount", o.valid_from::text AS "validFrom",
         o.valid_to::text AS "validTo", o.max_redemptions AS "maxRedemptions",
         o.per_customer_limit AS "perCustomerLimit", o.active, o.badge,
         count(cr.id)::int AS "usageCount"
    FROM offers o
    LEFT JOIN coupon_redemptions cr ON cr.offer_id = o.id
`;

export async function listOffersAdmin() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `${OFFER_SELECT_ADMIN} WHERE o.hotel_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
    [hotel.id]
  );
  return result.rows.map(serializeOffer);
}

export async function createOffer({ input }) {
  const { hotel } = await getHotelContext();
  return withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO offers (hotel_id, code, title, description, discount_type, discount_value,
                            max_discount, min_booking_amount, valid_from, valid_to,
                            max_redemptions, per_customer_limit, badge, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, CURRENT_DATE), $10, $11, $12, $13, coalesce($14,true))
       RETURNING id`,
      [
        hotel.id,
        String(input.code).trim().toUpperCase(),
        String(input.title).trim(),
        input.description ? String(input.description).trim() : null,
        input.discountType,
        input.discountValue,
        input.maxDiscount ?? null,
        input.minBookingAmount ?? 0,
        input.validFrom ?? null,
        input.validTo ?? null,
        input.maxRedemptions ?? null,
        input.perCustomerLimit ?? 1,
        input.badge ? String(input.badge).trim() : null,
        input.active ?? true,
      ]
    );
    const res = await client.query(`${OFFER_SELECT_ADMIN} WHERE o.id=$1 GROUP BY o.id`, [ins.rows[0].id]);
    return serializeOffer(res.rows[0]);
  });
}

export async function updateOffer({ id, input }) {
  return withTransaction(async (client) => {
    const cur = await client.query(`SELECT id FROM offers WHERE id=$1`, [id]);
    if (cur.rowCount === 0) throw notFound("Offer not found.");
    await client.query(
      `UPDATE offers
          SET title = coalesce($2, title),
              description = coalesce($3, description),
              discount_type = coalesce($4, discount_type),
              discount_value = coalesce($5, discount_value),
              max_discount = coalesce($6, max_discount),
              min_booking_amount = coalesce($7, min_booking_amount),
              valid_from = coalesce($8, valid_from),
              valid_to = coalesce($9, valid_to),
              max_redemptions = coalesce($10, max_redemptions),
              per_customer_limit = coalesce($11, per_customer_limit),
              badge = coalesce($12, badge),
              active = coalesce($13, active),
              updated_at = now()
        WHERE id = $1`,
      [
        id,
        input.title ? String(input.title).trim() : null,
        input.description !== undefined ? String(input.description).trim() || null : null,
        input.discountType ?? null,
        input.discountValue ?? null,
        input.maxDiscount ?? null,
        input.minBookingAmount ?? null,
        input.validFrom ?? null,
        input.validTo ?? null,
        input.maxRedemptions ?? null,
        input.perCustomerLimit ?? null,
        input.badge !== undefined ? String(input.badge).trim() || null : null,
        input.active ?? null,
      ]
    );
    const res = await client.query(`${OFFER_SELECT_ADMIN} WHERE o.id=$1 GROUP BY o.id`, [id]);
    return serializeOffer(res.rows[0]);
  });
}

export async function removeOffer({ id }) {
  try {
    await pool.query(`DELETE FROM offers WHERE id = $1`, [id]);
    return { id, deactivated: false };
  } catch (error) {
    if (error.code === "23503") {
      await pool.query(`UPDATE offers SET active = false, updated_at = now() WHERE id = $1`, [id]);
      return { id, deactivated: true };
    }
    throw error;
  }
}
