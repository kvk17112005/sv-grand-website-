# State Machine & Lifecycle

## States
- `pending_payment` — booking created, request reference (REQ-XXXX). Inventory held via allotment (not active on physical room yet). Expires at `hold_expires_at` (default 60 min from settings).
- `payment_verification` — UPI reference (UTR) submitted. Awaiting admin verification.
- `confirmed` — approved/verified. Booking ID (SVG-XXXXXX) assigned if pending; physical room assigned if free; booking_rooms.is_active → true (blocks physical room). Blocks inventory.
- `checked_in` — guest checked in. Blocks inventory.
- `checked_out` — completed.
- `cancelled` — cancelled (from non-terminal states). Releases held inventory (allotment becomes inactive; physical room freed).
- `no_show` — confirmed but not checked in as planned.

`payment_status` is separate: `awaiting_payment | reference_submitted | verified | rejected | pay_at_hotel | refunded`.

## Transitions
```
pending_payment → payment_verification (UTR submitted)
pending_payment → confirmed (pay_at_hotel/admin direct)
pending_payment → cancelled
payment_verification → confirmed (admin verifies)
payment_verification → pending_payment (rejected)
payment_verification → cancelled
confirmed → checked_in
confirmed → cancelled
confirmed → no_show
checked_in → checked_out
others terminal
```
- Identity transition allowed (no-op).
- Invalid transitions → 409.

## Inventory
- Room-type allotment: `booking_rooms.stay` (daterange) + active status. Active when booking status in {confirmed, checked_in}. Holding statuses (`pending_payment`, `payment_verification`) count toward `reserved` if not expired (`hold_expires_at > now()`).
- Physical room assignment: `booking_rooms.physical_room_id` set; exclusion constraint `EXCLUDE USING gist (physical_room_id WITH =, stay WITH &&) WHERE (is_active AND physical_room_id IS NOT NULL)` prevents double-booking.
- Trigger `trg_bookings_sync_rooms_active` syncs `booking_rooms.is_active` on status changes.

## Payment Flow (UPI manual)
1. Create booking → `pending_payment`, `awaiting_payment`, REQ-XXXX
2. Submit UTR → record `payments` (reference_submitted), booking → `payment_verification`, `payment_status=reference_submitted`
3. Admin verifies → payment → `verified`, booking → `confirmed`; SVG-XXXXXX assigned; room assigned if available; allotments activated

Pay-at-hotel: payment_status `pay_at_hotel`; admin can confirm directly.

## Guest Checkout
- `bookings.user_id` nullable. `guests` table records identity. Secure linking later.
