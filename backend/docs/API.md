# API Reference

Base paths: `/api`.

All write requests (POST/PUT/PATCH/DELETE) require CSRF via header `X-CSRF-Token` (obtained from `/api/auth/csrf`). Cookies: `svgrand.sid` (HttpOnly, SameSite Lax in dev, Secure+SameSite None in production).

## Public
- `GET /api/health` — `{status:"ok"}`
- `GET /api/hotel` — full public catalog: hotel, settings, roomTypes (with rates/images/amenities/totalRooms), offers, addOns, reviews
- `GET /api/room-types` — `{roomTypes:[...]}`
- `GET /api/offers` — `{offers:[...]}`
- `GET /api/add-ons` — `{addOns:[...]}`
- `GET /api/reviews` — `{reviews:[...]}`
- `GET /api/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD` — `{availability:[{code,total,reserved,available}]}`
- `GET /api/bookings/request/:reference` — public lookup by REQ- or SVG- reference → `{booking:{...}}`
- `GET /api/payments/:paymentId` — payment status and booking details for a UPI intent UUID; this endpoint never infers success from a browser redirect
- `POST /api/payments/webhook` — optional signed-provider callback; requires `PAYMENT_WEBHOOK_SECRET` and `X-Payment-Signature: sha256=<HMAC-SHA256 of exact raw JSON body>`

## Auth
- `GET /api/auth/csrf` — `{csrfToken}`
- `GET /api/auth/session` — `{user|null}`
- `POST /api/auth/register` (CSRF + authLimiter) — body `{name,email,phone,password}` → `{user}`
- `POST /api/auth/login` (CSRF + authLimiter) — `{email,password}` → `{user}`
- `POST /api/auth/logout` (CSRF) → 204

## Account (authenticated + CSRF)
- `PUT /api/account/profile` — `{name,phone}` → `{user}`
- `PUT /api/account/password` — `{currentPassword,newPassword}` → `{message}`

## Bookings
- `GET /api/bookings` (optionalAuth) — returns bookings for authenticated user only; unauthenticated returns `{bookings:[]}` (no email leak)
- `POST /api/bookings/quote` (CSRF + writeLimiter) — server-side price and availability quote based on room, dates, guests, coupon, and add-ons; ignores frontend amounts
- `POST /api/bookings` (CSRF + writeLimiter, optionalAuth) — creates a pending booking. Accepts `idempotencyKey` (UUID) so a retried request returns the same booking; ignores frontend price fields
- `POST /api/bookings/:idOrRef/payment-intent` (CSRF + writeLimiter) — creates or reuses a single server-priced UPI intent. Response includes amount, merchant display name, UPI URI, payment ID, and current booking
- `POST /api/bookings/:idOrRef/payment` (legacy CSRF + writeLimiter) — accepts a UTR for manual staff verification only. Customer-submitted UTRs/screenshots never count as automatic verification
- `POST /api/bookings/:idOrRef/link` (authenticated + CSRF + writeLimiter) — links a guest booking to the signed-in account when the guest email/phone matches. Body `{}`; ownership inferred from session. Returns `{booking}`; `403` on mismatch, `409` if already linked to another account

## Admin (admin/super_admin required + CSRF for writes)
- `GET /api/admin/overview` — `{stats, bookings, customers, staff?}`
- `GET /api/admin/bookings` — `{bookings:[...]}`
- `GET /api/admin/rooms` — `{rooms:[...]}`
- `GET /api/admin/bookings/verify/:code` — lookup → `{booking}` or 404
- `GET /api/admin/bookings/:idOrRef` — `{booking}`
- `PATCH /api/admin/bookings/:idOrRef/status` (CSRF) — body `{status, note?, reason?}`. Status aliases: `approved`→`confirmed`, `rejected`/`reject`→`cancelled`. Confirming requires a payment status of `success` or staff/provider-verified `verified`.
- `POST /api/admin/bookings/:idOrRef/payment/verify` (CSRF) — body `{approve: boolean, reason?}`. Approve: payment → `verified`, booking paymentStatus `verified` (booking stays in `payment_verification` for the separate approval step). Reject: `reason` **required**, payment/booking → `rejected`, booking returns to `pending_payment`, `holdExpiresAt` reset from `hotel_settings.hold_expiry_minutes`, and a `booking_status_history` row is recorded. `400` if no submitted payment exists or reason missing.
- `POST /api/admin/bookings/:idOrRef/assign-room` (CSRF) — `{roomId}` assigns a physical room

## Booking Object (key fields)
- `id`, `bookingId` (SVG-… or REQ-… in pending), `bookingCode`, `requestReference`, `status`, `paymentStatus`, `paymentMethod`, `roomName`, `roomType`, `assignedRoomNumber`, `checkIn/checkOut`, `nights`, `adults/children/totalGuests`, `price/roomTotal/extraGuestTotal/discountAmount/taxAmount/grandTotal`, `couponCode`, `addOns`, `payments`, `holdExpiresAt`, `confirmedAt`, timestamps, `allowedTransitions`

## Signed payment event contract

The webhook is a generic integration boundary, not a claimed Canara Bank API.
The merchant/provider must first prove a transaction through its authenticated
status API or official signed webhook, then an adapter/relay must send:

```json
{
  "eventId": "provider-unique-event-id",
  "paymentId": "local-payment-intent-uuid",
  "bookingId": "local-booking-uuid",
  "bookingReference": "REQ-1234",
  "amount": 3000,
  "currency": "INR",
  "status": "success",
  "transactionReference": "verified-bank-transaction-id"
}
```

`status` is `pending`, `success`, `failed`, or `cancelled`. The backend checks
the signature, event idempotency, payment/booking association, expected amount,
currency, and transaction reference before updating state. Successful callbacks
confirm the booking in the same database transaction when inventory is still
available. A delayed success with no available room is recorded as paid but
keeps booking confirmation pending for staff resolution.

## Errors
400 bad request, 401 unauthorized, 403 forbidden/CSRF, 404 not found, 409 conflict (duplicate, overbooking, invalid transition).
