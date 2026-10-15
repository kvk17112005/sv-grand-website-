import { pool } from "../db.js";
import { HOTEL_CODE } from "../lib/constants.js";
import { notFound } from "../lib/errors.js";

export async function getHotelContext() {
  const hotelResult = await pool.query(
    `SELECT id, code, name, tagline, address, city, state, pincode, country, phone, email,
            timezone, currency, latitude, longitude
       FROM hotels
      WHERE code = $1 AND is_active = true`,
    [HOTEL_CODE]
  );
  const hotel = hotelResult.rows[0];
  if (!hotel) throw notFound("Hotel is not configured.");

  const settingsResult = await pool.query(
    `SELECT check_in_time AS "checkInTime", check_out_time AS "checkOutTime",
            extra_guest_charge::float AS "extraGuestCharge", child_free_age AS "childFreeAge",
            hold_expiry_minutes AS "holdExpiryMinutes", tax_percentage::float AS "taxPercentage",
            tax_inclusive AS "taxInclusive",
            upi_id AS "upiId", upi_payee_name AS "upiPayeeName", qr_image_path AS "qrImagePath",
            gst_number AS "gstNumber", wizard_discount_percentage::float AS "wizardDiscountPercentage",
            policy_text AS "policyText", policy_version AS "policyVersion"
       FROM hotel_settings
      WHERE hotel_id = $1`,
    [hotel.id]
  );

  return { hotel, settings: settingsResult.rows[0] || null };
}

export async function listRoomTypes() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `SELECT rt.id, rt.code, rt.name, rt.tagline, rt.description, rt.is_ac AS "isAc",
            rt.bedroom_type AS "bedroomType", rt.max_adults AS "maxAdults",
            rt.max_children AS "maxChildren", rt.max_guests AS "maxGuests",
            rt.size_sqft AS "sizeSqft", rt.bed_type AS "bedType",
            rt.discount_percentage::float AS "discountPercentage", rt.display_order AS "displayOrder",
            coalesce((
              SELECT json_agg(json_build_object(
                'stayDuration', r.stay_duration, 'amount', r.amount::float) ORDER BY r.stay_duration)
                FROM room_type_rates r
               WHERE r.room_type_id = rt.id
                 AND r.effective_from <= CURRENT_DATE
                 AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
            ), '[]'::json) AS rates,
            coalesce((
              SELECT json_agg(json_build_object('url', ri.url, 'altText', ri.alt_text) ORDER BY ri.sort_order)
                FROM room_images ri WHERE ri.room_type_id = rt.id
            ), '[]'::json) AS images,
            coalesce((
              SELECT json_agg(json_build_object('code', a.code, 'name', a.name, 'icon', a.icon) ORDER BY a.sort_order)
                FROM room_type_amenities rta JOIN amenities a ON a.id = rta.amenity_id
               WHERE rta.room_type_id = rt.id
            ), '[]'::json) AS amenities,
            (SELECT count(*)::int FROM physical_rooms p
              WHERE p.room_type_id = rt.id AND p.is_active = true) AS "totalRooms"
       FROM room_types rt
      WHERE rt.hotel_id = $1 AND rt.is_active = true
      ORDER BY rt.display_order`,
    [hotel.id]
  );
  return result.rows;
}

export async function listOffers() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `SELECT id, code, title, description, discount_type AS "discountType",
            discount_value::float AS "discountValue", max_discount::float AS "maxDiscount",
            min_booking_amount::float AS "minBookingAmount", valid_from::text AS "validFrom",
            valid_to::text AS "validTo", badge
       FROM offers
      WHERE hotel_id = $1 AND active = true
        AND valid_from <= CURRENT_DATE
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
      ORDER BY created_at`,
    [hotel.id]
  );
  return result.rows;
}

export async function listAddOns() {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `SELECT id, code, name, description, price::float AS price, per_night AS "perNight", icon
       FROM add_on_services
      WHERE hotel_id = $1 AND active = true
      ORDER BY name`,
    [hotel.id]
  );
  return result.rows;
}

export async function listApprovedReviews(limit = 50) {
  const { hotel } = await getHotelContext();
  const result = await pool.query(
    `SELECT r.id, r.guest_name AS "guestName", r.rating, r.title, r.comment,
            r.stay_type AS "stayType", r.helpful_votes AS "helpfulVotes",
            r.created_at AS "createdAt",
            rr.text AS "responseText", rr.responder_name AS "responderName"
       FROM reviews r
       LEFT JOIN review_responses rr ON rr.review_id = r.id
      WHERE r.hotel_id = $1 AND r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT $2`,
    [hotel.id, limit]
  );
  return result.rows;
}

export async function getPublicCatalog() {
  const { hotel, settings } = await getHotelContext();
  const [roomTypes, offers, addOns, reviews] = await Promise.all([
    listRoomTypes(),
    listOffers(),
    listAddOns(),
    listApprovedReviews(),
  ]);
  return { hotel, settings, roomTypes, offers, addOns, reviews };
}

export async function findOfferByCode(hotelId, code) {
  if (!code) return null;
  const result = await pool.query(
    `SELECT id, code, discount_type AS "discountType", discount_value::float AS "discountValue",
            max_discount::float AS "maxDiscount", min_booking_amount::float AS "minBookingAmount"
       FROM offers
      WHERE hotel_id = $1 AND upper(code) = upper($2) AND active = true
        AND valid_from <= CURRENT_DATE AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)`,
    [hotelId, code]
  );
  return result.rows[0] || null;
}
