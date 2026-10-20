import { createHash } from "node:crypto";
import { pool, withTransaction } from "../db.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { generateRequestReference, generateBookingId } from "../lib/references.js";
import { calculateStayPricing, computeNights } from "../lib/pricing.js";
import { canTransition } from "../lib/bookingState.js";
import {
  BOOKING_SELECT,
  serializeBooking,
} from "../lib/serializers.js";
import {
  assertNotInPast,
  countReserved,
  getRoomTypeByCode,
  getRoomTypeRates,
  pickAvailableRooms,
  resolveRoomTypeCode,
} from "./availability.js";
import { findOfferByCode, getHotelContext } from "./catalog.js";

function toPositiveInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

async function loadSettings(client) {
  const { hotel, settings } = await getHotelContext();
  return {
    hotelId: hotel.id,
    extraGuestCharge: Number(settings?.extraGuestCharge ?? 500),
    holdExpiryMinutes: Number(settings?.holdExpiryMinutes ?? 60),
    taxPercentage: Number(settings?.taxPercentage ?? 0),
  };
}

async function loadAddOnServices(client, hotelId, codes) {
  if (!codes || codes.length === 0) return [];
  const result = await client.query(
    `SELECT id, code, name, price, per_night AS "perNight"
       FROM add_on_services
      WHERE hotel_id = $1 AND active = true AND code = ANY($2)`,
    [hotelId, codes]
  );
  return result.rows;
}

async function findOrCreateGuest(client, user, { name, phone, email }) {
  if (user) {
    return { id: null, userId: user.id };
  }
  const existing = email
    ? await client.query(
        `SELECT id FROM guests WHERE lower(email) = lower($1) ORDER BY created_at LIMIT 1`,
        [email]
      )
    : { rows: [] };
  if (existing.rows[0]) return { id: existing.rows[0].id, userId: null };

  const inserted = await client.query(
    `INSERT INTO guests (name, email, phone) VALUES ($1, $2, $3) RETURNING id`,
    [name, email || null, phone || null]
  );
  return { id: inserted.rows[0].id, userId: null };
}

async function insertBookingWithReference(client, values) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reference = generateRequestReference();
    try {
      const result = await client.query(
        `INSERT INTO bookings (
           hotel_id, request_reference, user_id, guest_id, room_type, room_name, room_type_id,
           price, guest_name, guest_phone, guest_email, check_in, check_out,
           adults, children, children_13_plus, children_below_13, total_guests, nights,
           stay_duration, room_total, extra_guest_total, grand_total,
           discount_amount, tax_percentage, tax_amount, coupon_id, special_requests,
           status, payment_status, hold_expires_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,
           $8,$9,$10,$11,$12,$13,
           $14,$15,$16,$17,$18,$19,
           $20,$21,$22,$23,
           $24,$25,$26,$27,$28,
           'pending_payment',$29,$30
         )
         RETURNING id, request_reference AS "requestReference"`,
        [...values.prefix, reference, ...values.suffix]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505" && String(error.constraint || "").includes("request_reference")) {
        continue;
      }
      throw error;
    }
  }
  throw conflict("Could not allocate a request reference. Please retry.");
}

export async function createBooking({ user, input }) {
  const settings = await loadSettings();
  const name = String(input.name ?? input.guestName ?? "").trim();
  const phone = String(input.phone ?? input.guestPhone ?? "").trim();
  const email = String(input.email ?? input.guestEmail ?? user?.email ?? "").trim().toLowerCase();
  const checkIn = input.checkIn;
  const checkOut = input.checkOut;
  const stayDuration = input.stayDuration === 12 ? 12 : 24;
  const adults = toPositiveInt(input.adults, 1) || 1;
  const children13Plus = toPositiveInt(input.children13Plus, 0);
  const childrenBelow13 =
    input.childrenBelow13 != null
      ? toPositiveInt(input.childrenBelow13, 0)
      : Math.max(0, toPositiveInt(input.children, 0) - children13Plus);
  const totalGuests = adults + childrenBelow13 + children13Plus;
  const roomsCount = toPositiveInt(input.roomsCount, 1) || 1;

  if (!name || !phone || !email) {
    throw badRequest("Guest name, phone, and email are required.");
  }
  if (!checkIn || !checkOut) {
    throw badRequest("Check-in and check-out dates are required.");
  }
  const nights = computeNights(checkIn, checkOut);
  if (!Number.isInteger(nights) || nights <= 0) {
    throw badRequest("Check-out must be after check-in.");
  }
  assertNotInPast(checkIn);

  const roomTypeCode = resolveRoomTypeCode({
    roomTypeCode: input.roomTypeCode,
    roomName: input.roomName,
  });
  if (!roomTypeCode) throw badRequest("A valid room type is required.");

  const idempotencyKey = input.idempotencyKey || null;
  const requestHash = idempotencyKey
    ? createHash("sha256")
        .update(
          JSON.stringify({
            userId: user?.id ?? null,
            name,
            phone,
            email,
            checkIn,
            checkOut,
            stayDuration,
            roomTypeCode,
            adults,
            children13Plus,
            childrenBelow13,
            roomsCount,
            addOnCodes: [...(input.addOnCodes || [])].sort(),
            couponCode: input.couponCode || null,
            paymentMethod: input.paymentMethod || "upi",
            specialRequests: input.specialRequests || null,
          })
        )
        .digest("hex")
    : null;

  try {
    return await withTransaction(async (client) => {
    if (idempotencyKey) {
      const previous = await client.query(
        `SELECT booking_id AS "bookingId", request_hash AS "requestHash"
           FROM booking_idempotency_keys
          WHERE idempotency_key = $1`,
        [idempotencyKey]
      );
      if (previous.rowCount > 0) {
        if (previous.rows[0].requestHash !== requestHash) {
          throw conflict("This booking request key was already used for different details.");
        }
        return getBookingById(client, previous.rows[0].bookingId);
      }
    }

    const roomType = await getRoomTypeByCode(client, settings.hotelId, roomTypeCode);
    if (totalGuests > roomType.maxGuests * roomsCount) {
      throw badRequest(
        `${roomType.name} allows up to ${roomType.maxGuests * roomsCount} guests across ${roomsCount} room(s). You entered ${totalGuests}.`
      );
    }

    const reserved = await countReserved(
      client,
      roomType.id,
      checkIn,
      checkOut
    );
    const totalRooms = (
      await client.query(
        `SELECT count(*)::int AS total FROM physical_rooms WHERE room_type_id = $1 AND is_active = true`,
        [roomType.id]
      )
    ).rows[0].total;
    if (reserved + roomsCount > totalRooms) {
      throw conflict(`${roomType.name} is fully booked for the selected dates.`);
    }

    const rates = await getRoomTypeRates(client, roomType.id);
    const room24Rate = rates[24];

    const addOnServices = await loadAddOnServices(client, settings.hotelId, input.addOnCodes || []);
    const addOns = addOnServices.map((svc) => ({
      service: svc,
      amount: Math.round(Number(svc.price) * (svc.perNight ? nights : 1) * roomsCount),
      quantity: 1,
    }));

    const coupon = input.couponCode
      ? await findOfferByCode(settings.hotelId, input.couponCode)
      : null;

    const pricing = calculateStayPricing({
      room24Rate,
      stayDuration,
      nights,
      children13Plus,
      extraGuestCharge: settings.extraGuestCharge,
      roomCount: roomsCount,
      addOns,
      coupon,
      taxPercentage: settings.taxPercentage,
    });

    const guest = await findOrCreateGuest(client, user, { name, phone, email });
    const paymentStatus = input.paymentMethod === "pay_at_hotel" ? "pay_at_hotel" : "pending";
    const holdExpiresAt = new Date(
      Date.now() + settings.holdExpiryMinutes * 60 * 1000
    ).toISOString();

    const inserted = await insertBookingWithReference(client, {
      prefix: [
        settings.hotelId,
      ],
      suffix: [
        user?.id ?? null,
        guest.id,
        roomType.isAc ? "AC ROOM" : "NON-AC ROOM",
        roomType.name,
        roomType.id,
        room24Rate,
        name,
        phone,
        email,
        checkIn,
        checkOut,
        adults,
        children13Plus + childrenBelow13,
        children13Plus,
        childrenBelow13,
        totalGuests,
        nights,
        stayDuration,
        pricing.roomTotal,
        pricing.extraGuestTotal,
        pricing.grandTotal,
        pricing.discountAmount,
        pricing.taxPercentage,
        pricing.taxAmount,
        coupon?.id ?? null,
        input.specialRequests ? String(input.specialRequests).slice(0, 1000) : null,
        paymentStatus,
        holdExpiresAt,
      ],
    });

    if (idempotencyKey) {
      await client.query(
        `INSERT INTO booking_idempotency_keys (idempotency_key, request_hash, booking_id)
         VALUES ($1, $2, $3)`,
        [idempotencyKey, requestHash, inserted.id]
      );
    }

    await client.query(
      `INSERT INTO booking_rooms (booking_id, room_type_id, quantity, stay, nightly_rate, room_total, is_active)
       VALUES ($1, $2, $3, daterange($4::date, $5::date, '[)'), $6, $7, false)`,
      [inserted.id, roomType.id, roomsCount, checkIn, checkOut, room24Rate, pricing.roomTotal]
    );

    for (const item of addOns) {
      await client.query(
        `INSERT INTO booking_add_ons (booking_id, add_on_service_id, quantity, unit_price, per_night, amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [inserted.id, item.service.id, roomsCount, item.service.price, item.service.perNight, item.amount]
      );
    }

    if (coupon) {
      await client.query(
        `INSERT INTO coupon_redemptions (offer_id, booking_id, user_id, guest_email, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [coupon.id, inserted.id, user?.id ?? null, email, pricing.discountAmount]
      );
    }

    await client.query(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, note)
       VALUES ($1, NULL, 'pending_payment', $2, 'Booking request created')`,
      [inserted.id, user?.id ?? null]
    );

    return getBookingById(client, inserted.id);
    });
  } catch (error) {
    if (
      idempotencyKey &&
      error.code === "23505" &&
      error.constraint === "booking_idempotency_keys_pkey"
    ) {
      const previous = await pool.query(
        `SELECT booking_id AS "bookingId", request_hash AS "requestHash"
           FROM booking_idempotency_keys
          WHERE idempotency_key = $1`,
        [idempotencyKey]
      );
      if (previous.rowCount > 0) {
        if (previous.rows[0].requestHash !== requestHash) {
          throw conflict("This booking request key was already used for different details.");
        }
        return getBookingById(pool, previous.rows[0].bookingId);
      }
    }
    throw error;
  }
}

export async function getBookingQuote({ input }) {
  const settings = await loadSettings();
  const checkIn = input.checkIn;
  const checkOut = input.checkOut;
  const nights = computeNights(checkIn, checkOut);
  if (!Number.isInteger(nights) || nights <= 0) {
    throw badRequest("Check-out must be after check-in.");
  }
  assertNotInPast(checkIn);

  const adults = toPositiveInt(input.adults, 1) || 1;
  const children13Plus = toPositiveInt(input.children13Plus, 0);
  const childrenBelow13 =
    input.childrenBelow13 != null
      ? toPositiveInt(input.childrenBelow13, 0)
      : Math.max(0, toPositiveInt(input.children, 0) - children13Plus);
  const totalGuests = adults + childrenBelow13 + children13Plus;
  const roomsCount = toPositiveInt(input.roomsCount, 1) || 1;
  const roomTypeCode = resolveRoomTypeCode({
    roomTypeCode: input.roomTypeCode,
    roomName: input.roomName,
  });
  if (!roomTypeCode) throw badRequest("A valid room type is required.");

  return withTransaction(async (client) => {
    const roomType = await getRoomTypeByCode(client, settings.hotelId, roomTypeCode);
    if (totalGuests > roomType.maxGuests * roomsCount) {
      throw badRequest(
        `${roomType.name} allows up to ${roomType.maxGuests * roomsCount} guests across ${roomsCount} room(s). You entered ${totalGuests}.`
      );
    }
    const reserved = await countReserved(client, roomType.id, checkIn, checkOut);
    const totalRooms = (
      await client.query(
        `SELECT count(*)::int AS total FROM physical_rooms WHERE room_type_id = $1 AND is_active = true`,
        [roomType.id]
      )
    ).rows[0].total;
    if (reserved + roomsCount > totalRooms) {
      throw conflict(`${roomType.name} is fully booked for the selected dates.`);
    }

    const rates = await getRoomTypeRates(client, roomType.id);
    const addOnServices = await loadAddOnServices(client, settings.hotelId, input.addOnCodes || []);
    const addOns = addOnServices.map((svc) => ({
      service: svc,
      amount: Math.round(Number(svc.price) * (svc.perNight ? nights : 1) * roomsCount),
      quantity: 1,
    }));
    const coupon = input.couponCode
      ? await findOfferByCode(settings.hotelId, input.couponCode)
      : null;
    const pricing = calculateStayPricing({
      room24Rate: rates[24],
      stayDuration: input.stayDuration === 12 ? 12 : 24,
      nights,
      children13Plus,
      extraGuestCharge: settings.extraGuestCharge,
      roomCount: roomsCount,
      addOns,
      coupon,
      taxPercentage: settings.taxPercentage,
    });

    return {
      roomTypeName: roomType.name,
      nights,
      currency: "INR",
      ...pricing,
    };
  });
}

export async function getBookingById(db, id) {
  const result = await db.query(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
  if (result.rowCount === 0) throw notFound("Booking not found.");
  const addOns = await loadAddOns(db, id);
  const payments = await loadPayments(db, id);
  return serializeBooking(result.rows[0], { addOns, payments });
}

export async function loadAddOns(db, bookingId) {
  const result = await db.query(
    `SELECT s.code, s.name, ba.quantity, ba.unit_price AS "unitPrice",
            ba.per_night AS "perNight", ba.amount
       FROM booking_add_ons ba
       JOIN add_on_services s ON s.id = ba.add_on_service_id
      WHERE ba.booking_id = $1
      ORDER BY s.name`,
    [bookingId]
  );
  return result.rows.map((r) => ({
    code: r.code,
    name: r.name,
    quantity: r.quantity,
    unitPrice: Number(r.unitPrice),
    perNight: r.perNight,
    amount: Number(r.amount),
  }));
}

export async function loadPayments(db, bookingId) {
  const result = await db.query(
    `SELECT id, method, amount, status, utr, upi_id AS "upiId",
            coalesce(provider_transaction_id, utr) AS "transactionReference",
            submitted_at AS "submittedAt", verified_at AS "verifiedAt",
            rejection_reason AS "rejectionReason", created_at AS "createdAt"
       FROM payments
      WHERE booking_id = $1
      ORDER BY created_at DESC`,
    [bookingId]
  );
  return result.rows.map((r) => ({ ...r, amount: Number(r.amount) }));
}

export async function listBookings({ user, email, all, limit = 200, status }) {
  const conditions = [];
  const values = [];
  if (all) {
    if (status) {
      values.push(status);
      conditions.push(`b.status = $${values.length}`);
    }
  } else if (user) {
    values.push(user.id, user.email);
    conditions.push(`(b.user_id = $1 OR lower(b.guest_email) = lower($2))`);
  } else if (email) {
    values.push(email);
    conditions.push(`lower(b.guest_email) = lower($1)`);
  } else {
    return [];
  }
  values.push(limit);
  const result = await pool.query(
    `${BOOKING_SELECT} ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY b.created_at DESC LIMIT $${values.length}`,
    values
  );
  return hydrateMany(result.rows);
}

export async function hydrateMany(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const addOns = await loadAddOns(pool, row.id);
      const payments = await loadPayments(pool, row.id);
      return serializeBooking(row, { addOns, payments });
    })
  );
}

export async function getBookingByReference(reference) {
  const clean = String(reference || "").trim();
  if (!clean) return null;
  const result = await pool.query(
    `${BOOKING_SELECT}
      WHERE upper(b.request_reference) = upper($1)
         OR upper(b.booking_id) = upper($1)
         OR upper(replace(coalesce(b.booking_id,''), '-', '')) = upper(replace($1, '-', ''))`,
    [clean]
  );
  if (result.rowCount === 0) return null;
  const addOns = await loadAddOns(pool, result.rows[0].id);
  const payments = await loadPayments(pool, result.rows[0].id);
  return serializeBooking(result.rows[0], { addOns, payments });
}

/**
 * Link a guest-created booking (user_id NULL) to an account once the caller
 * proves ownership by matching the guest email or phone on the booking.
 */
export async function linkBookingToUser({ reference, user }) {
  const clean = String(reference || "").trim();
  if (!clean) throw notFound("Booking not found.");

  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, user_id AS "userId", guest_email AS "guestEmail", guest_phone AS "guestPhone"
         FROM bookings
        WHERE upper(request_reference) = upper($1)
           OR upper(booking_id) = upper($1)
           OR upper(replace(coalesce(booking_id,''), '-', '')) = upper(replace($1, '-', ''))
        LIMIT 1
        FOR UPDATE`,
      [clean]
    );
    if (result.rowCount === 0) throw notFound("Booking not found.");
    const booking = result.rows[0];

    if (booking.userId && booking.userId !== user.id) {
      throw conflict("This booking is already linked to another account.");
    }

    const emailMatches =
      booking.guestEmail &&
      String(booking.guestEmail).toLowerCase() === String(user.email).toLowerCase();
    const guestPhone = String(booking.guestPhone || "").replace(/\D/g, "");
    const userPhone = String(user.phone || "").replace(/\D/g, "");
    const phoneMatches =
      guestPhone.length >= 7 && userPhone.length >= 7 && guestPhone.endsWith(userPhone);

    if (!emailMatches && !phoneMatches) {
      throw forbidden("This booking does not match your account details.");
    }

    if (!booking.userId) {
      await client.query(
        `UPDATE bookings SET user_id = $1, updated_at = now() WHERE id = $2`,
        [user.id, booking.id]
      );
    }

    return getBookingById(client, booking.id);
  });
}

export async function transitionBooking({ id, toStatus, actor, note, reason }) {
  return withTransaction(async (client) => {
    if (toStatus === "confirmed") {
      return confirmBookingInTransaction(client, id, actor, note);
    }

    const current = await client.query(
      `SELECT id, status, booking_id AS "bookingId", check_in::text AS "checkIn",
              check_out::text AS "checkOut", room_type_id AS "roomTypeId",
              assigned_room_id AS "assignedRoomId", payment_status AS "paymentStatus"
         FROM bookings WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (current.rowCount === 0) throw notFound("Booking not found.");
    const booking = current.rows[0];

    if (!canTransition(booking.status, toStatus)) {
      throw conflict(`Cannot move a booking from ${booking.status} to ${toStatus}.`);
    }

    await client.query(
      `UPDATE bookings
          SET status = $1,
              checked_in_at = CASE WHEN $1 = 'checked_in' THEN now() ELSE checked_in_at END,
              checked_out_at = CASE WHEN $1 = 'checked_out' THEN now() ELSE checked_out_at END,
              cancelled_at = CASE WHEN $1 = 'cancelled' THEN now() ELSE cancelled_at END,
              cancellation_reason = CASE WHEN $1 = 'cancelled' THEN $3 ELSE cancellation_reason END,
              updated_at = now()
        WHERE id = $2`,
      [toStatus, id, reason ?? null]
    );

    await client.query(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, booking.status, toStatus, actor?.id ?? null, note ?? null]
    );

    return getBookingById(client, id);
  });
}

export async function confirmBookingInTransaction(client, id, actor, note, { requireRoom = true } = {}) {
  const result = await client.query(
    `SELECT id, status, booking_id AS "bookingId", payment_status AS "paymentStatus",
            check_in::text AS "checkIn", check_out::text AS "checkOut",
            room_type_id AS "roomTypeId", assigned_room_id AS "assignedRoomId"
       FROM bookings WHERE id = $1 FOR UPDATE`,
    [id]
  );
  if (result.rowCount === 0) throw notFound("Booking not found.");
  const booking = result.rows[0];

  if (booking.status === "confirmed") return getBookingById(client, id);
  if (!canTransition(booking.status, "confirmed")) {
    throw conflict(`Cannot confirm a booking from ${booking.status}.`);
  }
  if (!["success", "verified"].includes(booking.paymentStatus)) {
    throw conflict("A booking can only be confirmed after payment has been verified.");
  }

  const allotmentResult = await client.query(
    `SELECT id, quantity, nightly_rate AS "nightlyRate", room_total AS "roomTotal"
       FROM booking_rooms
      WHERE booking_id = $1 AND room_type_id = $2
      ORDER BY created_at, id
      FOR UPDATE`,
    [id, booking.roomTypeId]
  );
  const roomCount = allotmentResult.rows.reduce((sum, row) => sum + Number(row.quantity), 0) || 1;
  const rooms = await pickAvailableRooms(
    client,
    booking.roomTypeId,
    booking.checkIn,
    booking.checkOut,
    roomCount
  );
  if (rooms.length < roomCount) {
    if (!requireRoom) return getBookingById(client, id);
    throw conflict("No room is currently available to confirm this booking.");
  }
  const bookingId = booking.bookingId || (await allocateBookingId(client));
  const firstAllotment = allotmentResult.rows[0];
  const perRoomTotal = Number(firstAllotment?.roomTotal || 0) / roomCount;

  try {
    if (firstAllotment) {
      await client.query(
        `UPDATE booking_rooms
            SET quantity = 1, physical_room_id = $1, room_total = $2, is_active = true
          WHERE id = $3`,
        [rooms[0].id, perRoomTotal, firstAllotment.id]
      );
    } else {
      await client.query(
        `INSERT INTO booking_rooms (
           booking_id, room_type_id, physical_room_id, quantity, stay, nightly_rate, room_total, is_active
         ) VALUES (
           $1, $2, $3, 1, daterange($4::date, $5::date, '[)'), $6, $7, true
         )`,
        [
          id,
          booking.roomTypeId,
          rooms[0].id,
          booking.checkIn,
          booking.checkOut,
          firstAllotment?.nightlyRate ?? 0,
          perRoomTotal,
        ]
      );
    }
    for (const room of rooms.slice(1)) {
      await client.query(
        `INSERT INTO booking_rooms (
           booking_id, room_type_id, physical_room_id, quantity, stay, nightly_rate, room_total, is_active
         ) VALUES (
           $1, $2, $3, 1, daterange($4::date, $5::date, '[)'), $6, $7, true
         )`,
        [
          id,
          booking.roomTypeId,
          room.id,
          booking.checkIn,
          booking.checkOut,
          firstAllotment?.nightlyRate ?? 0,
          perRoomTotal,
        ]
      );
    }
  } catch (error) {
    if (error.code === "23P01") {
      throw conflict("A selected room was booked by another guest. Please retry confirmation.");
    }
    throw error;
  }

  await client.query(
    `UPDATE bookings
        SET status = 'confirmed',
            booking_id = coalesce($1, booking_id),
            assigned_room_id = coalesce($3, assigned_room_id),
            confirmed_at = now(),
            updated_at = now()
      WHERE id = $2`,
    [bookingId, id, rooms[0].id]
  );

  await client.query(
    `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, note)
     VALUES ($1, $2, 'confirmed', $3, $4)`,
    [id, booking.status, actor?.id ?? null, note ?? "Payment verified"]
  );

  return getBookingById(client, id);
}

async function allocateBookingId(client) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateBookingId();
    const existing = await client.query(
      `SELECT 1 FROM bookings WHERE booking_id = $1`,
      [candidate]
    );
    if (existing.rowCount === 0) return candidate;
  }
  throw conflict("Could not allocate a booking ID. Please retry.");
}

export async function assignRoom({ id, roomId, actor }) {
  return withTransaction(async (client) => {
    const bookingResult = await client.query(
      `SELECT id, status, room_type_id AS "roomTypeId", check_in::text AS "checkIn",
              check_out::text AS "checkOut"
         FROM bookings WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (bookingResult.rowCount === 0) throw notFound("Booking not found.");
    const booking = bookingResult.rows[0];

    const roomResult = await client.query(
      `SELECT id, room_number AS "roomNumber", room_type_id AS "roomTypeId"
         FROM physical_rooms WHERE id = $1 AND is_active = true`,
      [roomId]
    );
    if (roomResult.rowCount === 0) throw notFound("Room not found.");
    const room = roomResult.rows[0];
    if (room.roomTypeId !== booking.roomTypeId) {
      throw badRequest("Selected room does not match the booked room type.");
    }

    try {
      await client.query(
        `UPDATE booking_rooms
            SET physical_room_id = $1
          WHERE booking_id = $2 AND room_type_id = $3 AND is_active = true`,
        [roomId, id, booking.roomTypeId]
      );
      await client.query(
        `UPDATE bookings SET assigned_room_id = $1, updated_at = now() WHERE id = $2`,
        [roomId, id]
      );
    } catch (error) {
      if (error.code === "23P01") {
        throw conflict("That room is already booked for overlapping dates.");
      }
      throw error;
    }

    await client.query(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, note)
       VALUES ($1, $2, $2, $3, $4)`,
      [id, booking.status, actor?.id ?? null, `Assigned room ${room.roomNumber}`]
    );

    return getBookingById(client, id);
  });
}
