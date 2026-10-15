import { Router } from "express";
import { pool } from "../db.js";
import { authenticated, optionalAuth } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { lookupLimiter, writeLimiter } from "../middleware/rateLimit.js";
import { bookingInput, bookingsQuery, paymentReferenceInput } from "../lib/schemas.js";
import { notFound } from "../lib/errors.js";
import {
  createBooking,
  getBookingByReference,
  linkBookingToUser,
  listBookings,
} from "../services/bookings.js";
import { submitPaymentReference } from "../services/payments.js";

const router = Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveBookingId(param) {
  if (UUID_RE.test(param)) return param;
  const result = await pool.query(
    `SELECT id FROM bookings
      WHERE upper(request_reference) = upper($1)
         OR upper(booking_id) = upper($1)
         OR upper(replace(coalesce(booking_id,''),'-','')) = upper(replace($1,'-',''))
      LIMIT 1`,
    [param]
  );
  return result.rows[0]?.id ?? null;
}

router.get("/", optionalAuth, validateQuery(bookingsQuery), async (req, res) => {
  // Never expose bookings by email to unauthenticated callers.
  if (!req.user) {
    return res.json({ bookings: [] });
  }
  res.json({ bookings: await listBookings({ user: req.user }) });
});

router.post("/", writeLimiter, requireCsrf, optionalAuth, validateBody(bookingInput), async (req, res) => {
  const booking = await createBooking({ user: req.user, input: req.body });
  res.status(201).json({ booking });
});

router.get("/request/:reference", lookupLimiter, async (req, res) => {
  const booking = await getBookingByReference(req.params.reference);
  if (!booking) throw notFound("No booking found for that reference.");
  res.json({ booking });
});

router.post(
  "/:idOrRef/payment",
  writeLimiter,
  requireCsrf,
  lookupLimiter,
  validateBody(paymentReferenceInput),
  async (req, res) => {
    const bookingId = await resolveBookingId(req.params.idOrRef);
    if (!bookingId) throw notFound("Booking not found.");
    const booking = await submitPaymentReference({
      bookingId,
      utr: req.body.utr,
      screenshotUrl: req.body.screenshotUrl,
    });
    res.json({ booking });
  }
);

router.post(
  "/:idOrRef/link",
  writeLimiter,
  requireCsrf,
  authenticated,
  async (req, res) => {
    const booking = await linkBookingToUser({
      reference: req.params.idOrRef,
      user: req.user,
    });
    res.json({ booking });
  }
);

router.get("/:idOrRef", optionalAuth, lookupLimiter, async (req, res) => {
  const booking = await getBookingByReference(req.params.idOrRef);
  if (!booking) throw notFound("Booking not found.");
  res.json({ booking });
});

export default router;
