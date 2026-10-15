import { z } from "zod";

export const registerInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  password: z.string().min(10).max(128),
});

export const credentialsInput = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const profileInput = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(30),
});

export const passwordChangeInput = z.object({
  currentPassword: z.string().min(1, "Current password is required.").max(128),
  newPassword: z.string().min(10, "New password must be at least 10 characters long.").max(128),
});

export const bookingInput = z.object({
  roomTypeCode: z.string().trim().max(40).optional(),
  roomName: z.string().trim().max(80).optional(),
  roomType: z.string().trim().max(80).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  guestName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  guestPhone: z.string().trim().min(7).max(30).optional(),
  email: z.string().trim().email().max(254).optional(),
  guestEmail: z.string().trim().email().max(254).optional(),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  stayDuration: z.union([z.literal(12), z.literal(24)]).optional(),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  children13Plus: z.number().int().min(0).max(20).optional(),
  childrenBelow13: z.number().int().min(0).max(20).optional(),
  totalGuests: z.number().int().min(1).max(40).optional(),
  nights: z.number().int().min(1).optional(),
  addOnCodes: z.array(z.string().trim().max(40)).max(20).optional(),
  couponCode: z.string().trim().max(40).optional(),
  specialRequests: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(["upi", "pay_at_hotel"]).optional(),
  bookingId: z.string().max(64).optional(),
  price: z.number().optional(),
  roomTotal: z.number().optional(),
  extraGuestTotal: z.number().optional(),
  grandTotal: z.number().optional(),
  aadhaar: z.string().max(20).optional(),
});

export const paymentReferenceInput = z.object({
  utr: z.string().trim().min(6).max(40),
  screenshotUrl: z.string().trim().url().max(500).optional(),
});

export const statusTransitionInput = z.object({
  status: z.string().trim().min(1).max(20),
  note: z.string().trim().max(500).optional(),
  reason: z.string().trim().max(500).optional(),
  assignRoom: z.boolean().optional(),
});

export const paymentDecisionInput = z.object({
  approve: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

export const roomAssignInput = z.object({
  roomId: z.string().uuid(),
});

export const availabilityQuery = z.object({
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
});

export const bookingsQuery = z.object({
  scope: z.string().optional(),
  email: z.string().trim().email().max(254).optional(),
});

// ---------------------------------------------------------------------------
// Admin / super-admin console inputs
// ---------------------------------------------------------------------------

const OPTIONAL_TEXT_500 = z.string().trim().max(500).optional();
const OPTIONAL_TEXT_1000 = z.string().trim().max(1000).optional();

export const roomStatusInput = z.object({
  operationalStatus: z
    .enum(["available", "occupied", "cleaning", "maintenance", "out_of_service"])
    .optional(),
  housekeepingStatus: z.enum(["dirty", "cleaning", "inspected", "clean"]).optional(),
  notes: OPTIONAL_TEXT_1000,
  assignedHousekeeper: z.string().trim().max(120).nullable().optional(),
});

export const checkInInput = z.object({
  roomNumber: z.string().trim().max(20).optional(),
  collectPayment: z.boolean().optional(),
  paymentMethod: z.enum(["upi", "pay_at_hotel"]).optional(),
});

export const paymentCollectInput = z.object({
  method: z.enum(["upi", "pay_at_hotel"]).optional(),
  amount: z.number().nonnegative().optional(),
  note: OPTIONAL_TEXT_500,
});

export const guestRequestInput = z.object({
  bookingId: z.string().uuid().optional(),
  bookingReference: z.string().trim().max(64).optional(),
  roomNumber: z.string().trim().max(20).optional(),
  guestName: z.string().trim().max(120).optional(),
  category: z
    .enum(["room_cleaning", "extra_towels", "food_order", "late_checkout", "maintenance", "other"])
    .optional(),
  title: z.string().trim().min(1).max(200),
  notes: OPTIONAL_TEXT_1000,
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const guestRequestUpdateInput = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignedStaffId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().trim().max(120).nullable().optional(),
  notes: OPTIONAL_TEXT_1000,
});

export const staffInput = z.object({
  name: z.string().trim().min(1).max(120),
  jobTitle: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(254).optional(),
  shift: z.string().trim().max(60).optional(),
  status: z.enum(["active", "on_leave", "inactive"]).optional(),
});

export const staffUpdateInput = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  jobTitle: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  shift: z.string().trim().max(60).nullable().optional(),
  status: z.enum(["active", "on_leave", "inactive"]).optional(),
});

export const offerInput = z.object({
  code: z.string().trim().min(2).max(40),
  title: z.string().trim().min(1).max(160),
  description: OPTIONAL_TEXT_1000,
  discountType: z.enum(["percentage", "flat"]),
  discountValue: z.number().nonnegative(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minBookingAmount: z.number().nonnegative().optional(),
  validFrom: z.iso.date().optional(),
  validTo: z.iso.date().nullable().optional(),
  maxRedemptions: z.number().int().nonnegative().nullable().optional(),
  perCustomerLimit: z.number().int().nonnegative().optional(),
  badge: z.string().trim().max(60).nullable().optional(),
  active: z.boolean().optional(),
});

export const offerUpdateInput = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: OPTIONAL_TEXT_1000,
  discountType: z.enum(["percentage", "flat"]).optional(),
  discountValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minBookingAmount: z.number().nonnegative().optional(),
  validFrom: z.iso.date().optional(),
  validTo: z.iso.date().nullable().optional(),
  maxRedemptions: z.number().int().nonnegative().nullable().optional(),
  perCustomerLimit: z.number().int().nonnegative().optional(),
  badge: z.string().trim().max(60).nullable().optional(),
  active: z.boolean().optional(),
});

export const reviewModerationInput = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

export const reviewResponseInput = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const roomTypePricingInput = z
  .object({
    twelveHourRate: z.number().nonnegative().optional(),
    twentyFourHourRate: z.number().nonnegative().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
  })
  .refine(
    (value) =>
      value.twelveHourRate !== undefined ||
      value.twentyFourHourRate !== undefined ||
      value.discountPercentage !== undefined,
    { message: "Provide at least one field to update." }
  );

export const hotelSettingsInput = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  tagline: z.string().trim().max(240).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  state: z.string().trim().max(120).nullable().optional(),
  pincode: z.string().trim().max(20).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  checkInTime: z.string().trim().max(10).optional(),
  checkOutTime: z.string().trim().max(10).optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  gstNumber: z.string().trim().max(40).nullable().optional(),
  wizardDiscountPercentage: z.number().min(0).max(100).optional(),
  policyText: OPTIONAL_TEXT_1000,
});
