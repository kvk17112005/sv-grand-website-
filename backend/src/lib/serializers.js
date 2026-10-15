import { getAllowedTransitions } from "./bookingState.js";

function num(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function serializeBooking(row, extra = {}) {
  const reservationId = row.bookingId || row.requestReference;
  const addOns = extra.addOns || [];
  const payments = extra.payments || [];
  const assignedRoomNumber = row.assignedRoomNumber || null;

  return {
    id: row.id,
    bookingId: reservationId,
    bookingCode: reservationId,
    requestReference: row.requestReference,
    userId: row.userId ?? null,

    roomType: row.roomType,
    roomName: row.roomName,
    roomTypeId: row.roomTypeId,
    assignedRoomNumber,
    assignedRoomId: row.assignedRoomId ?? null,

    name: row.guestName,
    guestName: row.guestName,
    phone: row.guestPhone,
    guestPhone: row.guestPhone,
    email: row.guestEmail,
    guestEmail: row.guestEmail,

    checkIn: row.checkIn,
    checkOut: row.checkOut,
    checkInDate: row.checkIn,
    checkOutDate: row.checkOut,
    nights: num(row.nights),
    stayDuration: row.stayDuration,

    adults: num(row.adults),
    children: num(row.children),
    children13Plus: num(row.children13Plus),
    childrenBelow13: num(row.childrenBelow13),
    totalGuests: num(row.totalGuests),

    price: num(row.price),
    twentyFourHourRate: num(row.price),
    roomTotal: num(row.roomTotal),
    extraGuestTotal: num(row.extraGuestTotal),
    addOnsTotal: num(row.addOnsTotal),
    discountAmount: num(row.discountAmount),
    taxAmount: num(row.taxAmount),
    taxPercentage: num(row.taxPercentage),
    grandTotal: num(row.grandTotal),
    totalAmount: num(row.grandTotal),
    currency: row.currency || "INR",

    couponCode: row.couponCode ?? null,
    specialRequests: row.specialRequests ?? null,

    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod ?? (row.paymentStatus === "pay_at_hotel" ? "pay_at_hotel" : "upi"),
    allowedTransitions: getAllowedTransitions(row.status),
    addOns,
    payments,

    holdExpiresAt: row.holdExpiresAt ?? null,
    confirmedAt: row.confirmedAt ?? null,
    checkedInAt: row.checkedInAt ?? null,
    checkedOutAt: row.checkedOutAt ?? null,
    cancelledAt: row.cancelledAt ?? null,
    cancellationReason: row.cancellationReason ?? null,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
  };
}

export const BOOKING_SELECT = `
  SELECT b.id,
         b.booking_id        AS "bookingId",
         b.request_reference AS "requestReference",
         b.user_id           AS "userId",
         b.room_type         AS "roomType",
         b.room_name         AS "roomName",
         b.room_type_id      AS "roomTypeId",
         b.price,
         b.guest_name        AS "guestName",
         b.guest_phone       AS "guestPhone",
         b.guest_email       AS "guestEmail",
         b.check_in::text    AS "checkIn",
         b.check_out::text   AS "checkOut",
         b.nights,
         b.stay_duration     AS "stayDuration",
         b.adults,
         b.children,
         b.children_13_plus  AS "children13Plus",
         b.children_below_13 AS "childrenBelow13",
         b.total_guests      AS "totalGuests",
         b.room_total        AS "roomTotal",
         b.extra_guest_total AS "extraGuestTotal",
         b.discount_amount   AS "discountAmount",
         b.tax_percentage    AS "taxPercentage",
         b.tax_amount        AS "taxAmount",
         b.grand_total       AS "grandTotal",
         b.currency,
         b.special_requests  AS "specialRequests",
         b.status,
         b.payment_status    AS "paymentStatus",
         b.assigned_room_id  AS "assignedRoomId",
         pr.room_number      AS "assignedRoomNumber",
         o.code              AS "couponCode",
         b.hold_expires_at   AS "holdExpiresAt",
         b.confirmed_at      AS "confirmedAt",
         b.checked_in_at     AS "checkedInAt",
         b.checked_out_at    AS "checkedOutAt",
         b.cancelled_at      AS "cancelledAt",
         b.cancellation_reason AS "cancellationReason",
         b.created_at        AS "createdAt",
         b.updated_at        AS "updatedAt"
  FROM bookings b
  LEFT JOIN physical_rooms pr ON pr.id = b.assigned_room_id
  LEFT JOIN offers o ON o.id = b.coupon_id
`;
