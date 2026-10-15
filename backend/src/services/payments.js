import { withTransaction } from "../db.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";
import { getBookingById } from "./bookings.js";

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
      if (payment.status === "verified") {
        throw conflict("This payment is already verified.");
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
