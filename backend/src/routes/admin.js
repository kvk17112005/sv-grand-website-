import { Router } from "express";
import { authenticated, requireRole } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { validateBody } from "../middleware/validate.js";
import { lookupLimiter } from "../middleware/rateLimit.js";
import {
  roomAssignInput,
  statusTransitionInput,
  paymentDecisionInput,
  roomStatusInput,
  guestRequestInput,
  guestRequestUpdateInput,
  staffInput,
  staffUpdateInput,
  offerInput,
  offerUpdateInput,
  reviewModerationInput,
  reviewResponseInput,
  roomTypePricingInput,
  hotelSettingsInput,
  checkInInput,
  paymentCollectInput,
} from "../lib/schemas.js";
import { badRequest, notFound } from "../lib/errors.js";
import { BOOKING_STATUSES } from "../lib/bookingState.js";
import {
  assignRoom,
  getBookingById,
  listBookings,
  transitionBooking,
} from "../services/bookings.js";
import { verifyPayment } from "../services/payments.js";
import { pool } from "../db.js";
import {
  findBookingForVerification,
  getOverview,
  getStaff,
} from "../services/admin.js";
import { listRooms, updateRoomStatus } from "../services/rooms.js";
import { checkInBooking, checkOutBooking, collectPayment } from "../services/frontdesk.js";
import { listGuestRequests, createGuestRequest, updateGuestRequest } from "../services/guestRequests.js";
import { listStaff, createStaff, updateStaff, removeStaff } from "../services/staff.js";
import { listOffersAdmin, createOffer, updateOffer, removeOffer } from "../services/offers.js";
import { listReviewsAdmin, moderateReview, respondToReview } from "../services/reviews.js";
import { updateHotelSettings } from "../services/settings.js";
import { getAnalytics } from "../services/analytics.js";
import { listRoomTypePricing, updateRoomTypePricing } from "../services/pricingAdmin.js";

const router = Router();
const requireSuper = requireRole("super_admin");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS_ALIASES = {
  approved: "confirmed",
  reject: "cancelled",
  rejected: "cancelled",
  pending: "pending_payment",
};

router.use(authenticated, requireRole("admin", "super_admin"));

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

router.get("/overview", async (req, res) => {
  const overview = await getOverview();
  const response = {
    stats: overview.stats,
    bookings: overview.bookings,
    customers: overview.customers,
  };
  if (req.user.role === "super_admin") {
    response.staff = await getStaff();
  }
  res.json(response);
});

router.get("/bookings", async (req, res) => {
  res.json({ bookings: await listBookings({ user: null, email: null, all: true }) });
});

router.get("/rooms", async (_req, res) => {
  res.json({ rooms: await listRooms() });
});

router.get("/bookings/verify/:code", lookupLimiter, async (req, res) => {
  const booking = await findBookingForVerification(req.params.code);
  if (!booking) {
    throw notFound(`No booking found matching "${req.params.code}".`);
  }
  res.json({ booking });
});

router.patch(
  "/bookings/:idOrRef/status",
  requireCsrf,
  validateBody(statusTransitionInput),
  async (req, res) => {
    const bookingId = await resolveBookingId(req.params.idOrRef);
    if (!bookingId) throw notFound("Booking not found.");

    const mapped = STATUS_ALIASES[req.body.status] || req.body.status;
    if (!BOOKING_STATUSES.includes(mapped)) {
      throw badRequest(`Unknown status "${req.body.status}".`);
    }

    const booking = await transitionBooking({
      id: bookingId,
      toStatus: mapped,
      actor: req.user,
      note: req.body.note,
      reason: req.body.reason,
    });
    res.json({ booking });
  }
);

router.post(
  "/bookings/:idOrRef/payment/verify",
  requireCsrf,
  validateBody(paymentDecisionInput),
  async (req, res) => {
    const bookingId = await resolveBookingId(req.params.idOrRef);
    if (!bookingId) throw notFound("Booking not found.");
    const booking = await verifyPayment({
      bookingId,
      approve: req.body.approve,
      reason: req.body.reason,
      actor: req.user,
    });
    res.json({ booking });
  }
);

router.post(
  "/bookings/:idOrRef/assign-room",
  requireCsrf,
  validateBody(roomAssignInput),
  async (req, res) => {
    const bookingId = await resolveBookingId(req.params.idOrRef);
    if (!bookingId) throw notFound("Booking not found.");
    const booking = await assignRoom({
      id: bookingId,
      roomId: req.body.roomId,
      actor: req.user,
    });
    res.json({ booking });
  }
);

router.post(
  "/bookings/:idOrRef/check-in",
  requireCsrf,
  validateBody(checkInInput),
  async (req, res) => {
    const bookingId = await resolveBookingId(req.params.idOrRef);
    if (!bookingId) throw notFound("Booking not found.");
    const booking = await checkInBooking({ bookingId, input: req.body, actor: req.user });
    res.json({ booking });
  }
);

router.post("/bookings/:idOrRef/check-out", requireCsrf, async (req, res) => {
  const bookingId = await resolveBookingId(req.params.idOrRef);
  if (!bookingId) throw notFound("Booking not found.");
  const booking = await checkOutBooking({ bookingId, actor: req.user });
  res.json({ booking });
});

router.post(
  "/bookings/:idOrRef/payment/collect",
  requireCsrf,
  validateBody(paymentCollectInput),
  async (req, res) => {
    const bookingId = await resolveBookingId(req.params.idOrRef);
    if (!bookingId) throw notFound("Booking not found.");
    const booking = await collectPayment({ bookingId, input: req.body, actor: req.user });
    res.json({ booking });
  }
);

router.get("/bookings/:idOrRef", async (req, res) => {
  const bookingId = await resolveBookingId(req.params.idOrRef);
  if (!bookingId) throw notFound("Booking not found.");
  res.json({ booking: await getBookingById(pool, bookingId) });
});

// ---------------------------------------------------------------------------
// Rooms & housekeeping
// ---------------------------------------------------------------------------

router.patch(
  "/rooms/:roomNumber/status",
  requireCsrf,
  validateBody(roomStatusInput),
  async (req, res) => {
    const room = await updateRoomStatus({
      roomNumber: req.params.roomNumber,
      input: req.body,
      actor: req.user,
    });
    res.json({ room });
  }
);

// ---------------------------------------------------------------------------
// Guest requests
// ---------------------------------------------------------------------------

router.get("/guest-requests", async (_req, res) => {
  res.json({ guestRequests: await listGuestRequests() });
});

router.post(
  "/guest-requests",
  requireCsrf,
  validateBody(guestRequestInput),
  async (req, res) => {
    const guestRequest = await createGuestRequest({ input: req.body, actor: req.user });
    res.status(201).json({ guestRequest });
  }
);

router.patch(
  "/guest-requests/:id",
  requireCsrf,
  validateBody(guestRequestUpdateInput),
  async (req, res) => {
    const guestRequest = await updateGuestRequest({
      id: req.params.id,
      input: req.body,
      actor: req.user,
    });
    res.json({ guestRequest });
  }
);

// ---------------------------------------------------------------------------
// Super-admin only: staff, offers, pricing, reviews, settings, analytics
// ---------------------------------------------------------------------------

router.get("/staff", requireSuper, async (_req, res) => {
  res.json({ staff: await listStaff() });
});

router.post("/staff", requireSuper, requireCsrf, validateBody(staffInput), async (req, res) => {
  const staff = await createStaff({ input: req.body });
  res.status(201).json({ staff });
});

router.patch(
  "/staff/:id",
  requireSuper,
  requireCsrf,
  validateBody(staffUpdateInput),
  async (req, res) => {
    const staff = await updateStaff({ id: req.params.id, input: req.body });
    res.json({ staff });
  }
);

router.delete("/staff/:id", requireSuper, requireCsrf, async (req, res) => {
  res.json(await removeStaff({ id: req.params.id }));
});

router.get("/offers", requireSuper, async (_req, res) => {
  res.json({ offers: await listOffersAdmin() });
});

router.post("/offers", requireSuper, requireCsrf, validateBody(offerInput), async (req, res) => {
  const offer = await createOffer({ input: req.body });
  res.status(201).json({ offer });
});

router.patch(
  "/offers/:id",
  requireSuper,
  requireCsrf,
  validateBody(offerUpdateInput),
  async (req, res) => {
    const offer = await updateOffer({ id: req.params.id, input: req.body });
    res.json({ offer });
  }
);

router.delete("/offers/:id", requireSuper, requireCsrf, async (req, res) => {
  res.json(await removeOffer({ id: req.params.id }));
});

router.get("/room-types/pricing", requireSuper, async (_req, res) => {
  res.json({ roomTypes: await listRoomTypePricing() });
});

router.patch(
  "/room-types/:id/pricing",
  requireSuper,
  requireCsrf,
  validateBody(roomTypePricingInput),
  async (req, res) => {
    const roomType = await updateRoomTypePricing({
      roomTypeId: req.params.id,
      input: req.body,
      actor: req.user,
    });
    res.json({ roomType });
  }
);

router.get("/reviews", requireSuper, async (_req, res) => {
  res.json({ reviews: await listReviewsAdmin() });
});

router.patch(
  "/reviews/:id",
  requireSuper,
  requireCsrf,
  validateBody(reviewModerationInput),
  async (req, res) => {
    const review = await moderateReview({ id: req.params.id, input: req.body });
    res.json({ review });
  }
);

router.post(
  "/reviews/:id/response",
  requireSuper,
  requireCsrf,
  validateBody(reviewResponseInput),
  async (req, res) => {
    const review = await respondToReview({ id: req.params.id, input: req.body, actor: req.user });
    res.json({ review });
  }
);

router.patch(
  "/settings",
  requireSuper,
  requireCsrf,
  validateBody(hotelSettingsInput),
  async (req, res) => {
    const settings = await updateHotelSettings({ input: req.body });
    res.json({ settings });
  }
);

router.get("/analytics", requireSuper, async (_req, res) => {
  res.json(await getAnalytics());
});

export default router;
