import { pool, withTransaction } from "../db.js";
import { getHotelContext } from "./catalog.js";
import { notFound } from "../lib/errors.js";

function serializeReview(row) {
  return {
    id: row.id,
    guestName: row.guestName,
    avatar: row.avatar ?? null,
    rating: Number(row.rating),
    date: row.createdAt,
    createdAt: row.createdAt,
    roomType: row.roomType ?? null,
    title: row.title ?? null,
    comment: row.comment ?? null,
    stayType: row.stayType ?? null,
    verified: !!row.verified,
    ratingsBreakdown: row.ratingsBreakdown ?? null,
    managerResponse: row.responseText
      ? {
          text: row.responseText,
          responderName: row.responderName ?? "General Manager & Guest Relations",
          date: row.responseCreatedAt ?? row.createdAt,
        }
      : null,
    approved: row.status === "approved",
    status: row.status,
    helpfulVotes: Number(row.helpfulVotes),
  };
}

const REV_SELECT_ADMIN = `
  SELECT r.id, r.guest_name AS "guestName", r.rating, r.title, r.comment,
         r.stay_type AS "stayType", r.status, r.helpful_votes AS "helpfulVotes",
         r.created_at AS "createdAt",
         (SELECT room_type FROM bookings b WHERE b.id = r.booking_id LIMIT 1) AS "roomType",
         rr.text AS "responseText", rr.responder_name AS "responderName",
         rr.created_at AS "responseCreatedAt"
    FROM reviews r
    LEFT JOIN review_responses rr ON rr.review_id = r.id
`;

export async function listReviewsAdmin() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `${REV_SELECT_ADMIN} WHERE r.hotel_id = $1 ORDER BY r.created_at DESC`,
    [hotel.id]
  );
  return result.rows.map(serializeReview);
}

export async function moderateReview({ id, input }) {
  return withTransaction(async (client) => {
    const cur = await client.query(`SELECT id FROM reviews WHERE id=$1`, [id]);
    if (cur.rowCount === 0) throw notFound("Review not found.");
    await client.query(`UPDATE reviews SET status = $2, updated_at = now() WHERE id = $1`, [
      id,
      input.status,
    ]);
    const res = await client.query(`${REV_SELECT_ADMIN} WHERE r.id=$1`, [id]);
    return serializeReview(res.rows[0]);
  });
}

export async function respondToReview({ id, input, actor }) {
  return withTransaction(async (client) => {
    const cur = await client.query(`SELECT id FROM reviews WHERE id=$1`, [id]);
    if (cur.rowCount === 0) throw notFound("Review not found.");
    await client.query(
      `INSERT INTO review_responses (review_id, text, responder_name, responder_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (review_id) DO UPDATE
         SET text = EXCLUDED.text, responder_name = EXCLUDED.responder_name,
             responder_user_id = EXCLUDED.responder_user_id, created_at = now()`,
      [id, String(input.text).trim(), actor?.name || "General Manager & Guest Relations", actor?.id ?? null]
    );
    const res = await client.query(`${REV_SELECT_ADMIN} WHERE r.id=$1`, [id]);
    return serializeReview(res.rows[0]);
  });
}
