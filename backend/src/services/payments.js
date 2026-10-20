import { randomUUID } from "node:crypto";
import { pool, withTransaction } from "../db.js";
import { ApiError, badRequest, conflict, notFound, unauthorized } from "../lib/errors.js";
import { confirmBookingInTransaction, getBookingById } from "./bookings.js";
import {
  buildUpiPaymentUri,
  normalizeProviderEvent,
  paymentWebhookConfigured,
  verifyPaymentWebhookSignature,
} from "./paymentProvider.js";
import { getHotelContext } from "./catalog.js";

const DEFAULT_MERCHANT_VPA = "3341101017051@cnrb";

async function getPaymentBookingStatus(queryable, bookingId) {
  const result = await queryable.query(
    `SELECT id, booking_id AS "bookingId", request_reference AS "requestReference",
            status, payment_status AS "paymentStatus"
       FROM bookings
      WHERE id = $1`,
    [bookingId]
  );
  if (result.rowCount === 0) throw notFound("Booking not found.");
  return {
    ...result.rows[0],
    bookingStatus: result.rows[0].status,
  };
}

export async function createUpiPaymentIntent({ bookingId }) {
  const { hotel } = await getHotelContext();
  const merchantVpa = process.env.UPI_MERCHANT_ID || DEFAULT_MERCHANT_VPA;
  const intent = await withTransaction(async (client) => {
    const bookingResult = await client.query(
      `SELECT id, request_reference AS "bookingReference", status, payment_status AS "paymentStatus",
              grand_total AS amount, currency
         FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bookingResult.rowCount === 0) throw notFound("Booking not found.");
    const booking = bookingResult.rows[0];
    if (booking.status === "cancelled") throw conflict("Payment is no longer available for this booking.");
    if (booking.paymentStatus === "pay_at_hotel") {
      throw conflict("This booking is set to pay at the hotel, not UPI.");
    }
    if (String(booking.currency || "INR").toUpperCase() !== "INR") {
      throw conflict("The merchant UPI flow only supports INR bookings.");
    }
    if (Number(booking.amount) <= 0) {
      throw badRequest("A positive amount is required for a UPI payment request.");
    }
    if (["success", "verified"].includes(booking.paymentStatus)) {
      throw conflict("This booking already has a verified payment.");
    }
    if (!["pending_payment", "payment_verification"].includes(booking.status)) {
      throw conflict("Payment is no longer available for this booking.");
    }

    const existing = await client.query(
      `SELECT id, status
         FROM payments
        WHERE booking_id = $1 AND provider = 'native_upi'
        FOR UPDATE`,
      [bookingId]
    );
    let payment;
    if (existing.rowCount > 0) {
      payment = existing.rows[0];
      if (payment.status !== "pending") {
        await client.query(
          `UPDATE payments
              SET status = 'pending', provider_transaction_id = NULL, verified_at = NULL,
                  rejection_reason = NULL, updated_at = now()
            WHERE id = $1`,
          [payment.id]
        );
      }
    } else {
      const paymentId = randomUUID();
      const result = await client.query(
        `INSERT INTO payments (
           id, booking_id, provider, method, amount, currency, provider_reference, status
         ) VALUES ($1, $2, 'native_upi', 'upi', $3, $4, $1, 'pending')
         RETURNING id, status`,
        [paymentId, bookingId, booking.amount, booking.currency || "INR"]
      );
      payment = result.rows[0];
    }

    await client.query(
      `UPDATE bookings SET payment_status = 'pending', updated_at = now() WHERE id = $1`,
      [bookingId]
    );
    const amount = Number(booking.amount);
    return {
      paymentId: payment.id,
      amount,
      currency: booking.currency || "INR",
      status: "pending",
      merchantVpa,
      merchantName: hotel.name,
      provider: "native_upi",
      upiUri: buildUpiPaymentUri({
        merchantVpa,
        merchantName: hotel.name,
        amount,
        bookingReference: booking.bookingReference,
        paymentId: payment.id,
      }),
    };
  });

  return { intent, booking: await getPaymentBookingStatus(pool, bookingId) };
}

export async function getPaymentIntentStatus(paymentId) {
  const result = await pool.query(
    `SELECT p.id, p.booking_id AS "bookingId", p.amount, p.currency, p.status,
            p.provider_transaction_id AS "transactionReference",
            p.verified_at AS "verifiedAt", b.status AS "bookingStatus",
            b.booking_id AS "publicBookingId", b.request_reference AS "bookingReference",
            b.payment_status AS "bookingPaymentStatus"
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
      WHERE p.id = $1 AND p.provider = 'native_upi'`,
    [paymentId]
  );
  if (result.rowCount === 0) throw notFound("Payment intent not found.");
  const row = result.rows[0];
  return {
    payment: { ...row, amount: Number(row.amount) },
    booking: {
      id: row.bookingId,
      bookingId: row.publicBookingId,
      requestReference: row.bookingReference,
      status: row.bookingStatus,
      bookingStatus: row.bookingStatus,
      paymentStatus: row.bookingPaymentStatus,
    },
  };
}

function amountInPaise(value) {
  const match = String(value).match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  return (BigInt(match[1]) * 100n + BigInt((match[2] || "").padEnd(2, "0") || "0")).toString();
}

export async function processPaymentWebhook({ payload, rawBody, signature }) {
  if (!paymentWebhookConfigured()) {
    throw new ApiError("Payment verification is not configured for this merchant.", 503);
  }
  if (!verifyPaymentWebhookSignature(rawBody, signature)) {
    throw unauthorized("Invalid payment provider signature.");
  }
  const event = normalizeProviderEvent(payload);
  if (!event) throw badRequest("Invalid payment provider event.");

  return withTransaction(async (client) => {
    const paymentResult = await client.query(
      `SELECT p.id, p.booking_id AS "bookingId", p.amount, p.currency, p.status,
              p.provider_transaction_id AS "transactionReference",
              b.request_reference AS "bookingReference", b.status AS "bookingStatus"
         FROM payments p
         JOIN bookings b ON b.id = p.booking_id
        WHERE p.id = $1 AND p.provider = 'native_upi'
        FOR UPDATE OF p, b`,
      [event.paymentId]
    );
    if (paymentResult.rowCount === 0) throw notFound("Payment intent not found.");
    const payment = paymentResult.rows[0];
    if (
      payment.bookingId !== event.bookingId ||
      payment.bookingReference !== event.bookingReference ||
      amountInPaise(payment.amount) !== event.amountPaise ||
      String(payment.currency).toUpperCase() !== event.currency
    ) {
      throw conflict("Payment provider event does not match the expected booking or amount.");
    }

    if (
      event.status === "success" &&
      payment.status !== "success"
    ) {
      const reusedTransaction = await client.query(
        `SELECT 1 FROM payments
          WHERE provider_transaction_id = $1 AND id <> $2`,
        [event.transactionReference, payment.id]
      );
      if (reusedTransaction.rowCount > 0) {
        throw conflict("This provider transaction is already associated with another payment.");
      }
    }

    const duplicate = await client.query(
      `SELECT 1 FROM payment_webhook_events WHERE provider_event_id = $1`,
      [event.eventId]
    );
    if (duplicate.rowCount > 0) {
      return {
        duplicate: true,
        payment: { id: payment.id, status: payment.status },
        booking: await getBookingById(client, payment.bookingId),
      };
    }

    if (payment.status === "success") {
      if (
        event.status === "success" &&
        payment.transactionReference !== event.transactionReference
      ) {
        throw conflict("A different transaction is already recorded for this payment.");
      }
      await client.query(
        `INSERT INTO payment_webhook_events (provider_event_id, payment_id) VALUES ($1, $2)`,
        [event.eventId, payment.id]
      );
      return {
        duplicate: true,
        payment: { id: payment.id, status: payment.status },
        booking: await getBookingById(client, payment.bookingId),
      };
    }

    await client.query(
      `UPDATE payments
          SET status = $1,
              provider_transaction_id = CASE WHEN $1 = 'success' THEN $2 ELSE provider_transaction_id END,
              verified_at = CASE WHEN $1 = 'success' THEN now() ELSE verified_at END,
              updated_at = now()
        WHERE id = $3`,
      [event.status, event.status === "success" ? event.transactionReference : null, payment.id]
    );
    await client.query(
      `UPDATE bookings SET payment_status = $1, updated_at = now() WHERE id = $2`,
      [event.status, payment.bookingId]
    );

    let booking;
    if (event.status === "success" && payment.bookingStatus !== "cancelled") {
      booking = await confirmBookingInTransaction(
        client,
        payment.bookingId,
        null,
        `Payment verified by provider event ${event.eventId}`,
        { requireRoom: false }
      );
    } else {
      booking = await getBookingById(client, payment.bookingId);
    }

    await client.query(
      `INSERT INTO payment_webhook_events (provider_event_id, payment_id) VALUES ($1, $2)`,
      [event.eventId, payment.id]
    );
    return {
      duplicate: false,
      payment: { id: payment.id, status: event.status },
      booking,
    };
  });
}

export async function submitPaymentReference({ bookingId, utr, screenshotUrl, method = "upi" }) {
  if (method !== "upi") throw badRequest("Only UPI references can be submitted.");
  const trimmedUtr = String(utr || "").trim();
  if (trimmedUtr.length < 6 || trimmedUtr.length > 40) {
    throw badRequest("Enter a valid UPI transaction reference (UTR).");
  }

  return withTransaction(async (client) => {
    const bookingResult = await client.query(
      `SELECT id, status, payment_status AS "paymentStatus"
         FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bookingResult.rowCount === 0) throw notFound("Booking not found.");
    const booking = bookingResult.rows[0];

    if (!["pending_payment", "payment_verification"].includes(booking.status)) {
      throw conflict("Payment can no longer be submitted for this booking.");
    }

    const duplicate = await client.query(
      `SELECT 1 FROM payments WHERE utr = $1 AND booking_id <> $2`,
      [trimmedUtr, bookingId]
    );
    if (duplicate.rowCount > 0) {
      throw conflict("This UTR has already been submitted for another booking.");
    }

    const existing = await client.query(
      `SELECT id, status FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [bookingId]
    );

    if (existing.rowCount === 0) {
      await client.query(
        `INSERT INTO payments (booking_id, method, amount, utr, screenshot_url, status, submitted_at)
         VALUES ($1, 'upi', (SELECT grand_total FROM bookings WHERE id = $1), $2, $3, 'reference_submitted', now())`,
        [bookingId, trimmedUtr, screenshotUrl || null]
      );
    } else if (existing.rows[0].status !== "verified") {
      await client.query(
        `UPDATE payments
            SET utr = $2, screenshot_url = $3, status = 'reference_submitted',
                submitted_at = now(), updated_at = now(), rejection_reason = NULL
          WHERE id = $1`,
        [existing.rows[0].id, trimmedUtr, screenshotUrl || null]
      );
    }

    await client.query(
      `UPDATE bookings SET payment_status = 'reference_submitted', updated_at = now() WHERE id = $1`,
      [bookingId]
    );

    if (booking.status === "pending_payment") {
      await client.query(
        `UPDATE bookings SET status = 'payment_verification', updated_at = now() WHERE id = $1`,
        [bookingId]
      );
      await client.query(
        `INSERT INTO booking_status_history (booking_id, from_status, to_status, note)
         VALUES ($1, 'pending_payment', 'payment_verification', 'UPI reference submitted')`,
        [bookingId]
      );
    }

    return getBookingById(client, bookingId);
  });
}

export async function verifyPayment({ bookingId, approve, actor, reason }) {
  return withTransaction(async (client) => {
    const bookingResult = await client.query(
      `SELECT id, status FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );
    if (bookingResult.rowCount === 0) throw notFound("Booking not found.");
    const booking = bookingResult.rows[0];

    const paymentResult = await client.query(
      `SELECT id, status FROM payments
        WHERE booking_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE`,
      [bookingId]
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      throw badRequest("No payment reference has been submitted for this booking.");
    }

    if (approve) {
      if (payment.status === "verified" || payment.status === "success") {
        throw conflict("This payment is already verified.");
      }
      if (payment.status !== "reference_submitted") {
        throw badRequest("Only a submitted UPI reference can be manually verified.");
      }
      await client.query(
        `UPDATE payments SET status = 'verified', verified_by = $2, verified_at = now(),
                updated_at = now(), rejection_reason = NULL
          WHERE id = $1`,
        [payment.id, actor?.id ?? null]
      );
      await client.query(
        `UPDATE bookings SET payment_status = 'verified', updated_at = now() WHERE id = $1`,
        [bookingId]
      );
    } else {
      const trimmedReason = String(reason || "").trim().slice(0, 500);
      if (!trimmedReason) {
        throw badRequest("A reason is required when rejecting a payment.");
      }
      await client.query(
        `UPDATE payments SET status = 'rejected', verified_by = $2, verified_at = now(),
                updated_at = now(), rejection_reason = $3
          WHERE id = $1`,
        [payment.id, actor?.id ?? null, trimmedReason]
      );
      await client.query(
        `UPDATE bookings SET payment_status = 'rejected', updated_at = now() WHERE id = $1`,
        [bookingId]
      );

      // Rejecting a payment re-opens the booking so the guest can fix and
      // resubmit their UPI reference. Record the rejection in history.
      if (booking.status === "payment_verification") {
        const holdResult = await client.query(
          `SELECT hold_expiry_minutes AS minutes FROM hotel_settings WHERE hotel_id = (
             SELECT hotel_id FROM bookings WHERE id = $1
           )`,
          [bookingId]
        );
        const holdMinutes = Number(holdResult.rows[0]?.minutes ?? 60);
        await client.query(
          `UPDATE bookings
              SET status = 'pending_payment',
                  hold_expires_at = now() + ($2::text || ' minutes')::interval,
                  updated_at = now()
            WHERE id = $1`,
          [bookingId, holdMinutes]
        );
        await client.query(
          `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, note)
           VALUES ($1, 'payment_verification', 'pending_payment', $2, $3)`,
          [bookingId, actor?.id ?? null, `Payment rejected: ${trimmedReason}`]
        );
      }
    }

    return getBookingById(client, bookingId);
  });
}
