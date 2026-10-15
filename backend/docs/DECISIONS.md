# Decisions (final)

1. **Payments**: No gateway. Static UPI QR + UPI ID `3341101017051@cnrb`, payee `Kummara Papamma`, QR at `/payment-qr.jpeg`. Manual UTR submission. Admin verification required. `pay_at_hotel` option. Never auto-verify.
2. **Guest checkout**: `bookings.user_id` nullable + `guests` table. Remove first-customer fallback.
3. **Hybrid inventory**: Room-type allotment at booking (counts against availability for holding+blocking statuses). Physical room assigned later (or at confirmation). `btree_gist` exclusion on active physical-room overlaps. Cancelled/expired release inventory.
4. **State machine**: `pending_payment → payment_verification → confirmed → checked_in → checked_out`; branches `cancelled`, `no_show`. Separate `payment_status`. Booking ID (SVG-XXXXXX) generated at admin approval. Pending handle `REQ-XXXX`.
5. **Taxes**: `tax_percentage=0`. Legal verification required before enabling.
6. **Testing**: Node built-in `node:test` + `node:assert`. Isolated test DB `sv_grand_test` (separate Neon database).
7. **Multi-tenancy/hotel scoping**: Keep `hotel_id` on hotel-owned tables. Single seeded hotel.

## Follow-ups confirmed
- short code `REQ-XXXX` for pending
- second Neon DB for tests
- UPI ID and payee confirmed
- booking ID assigned at approval
- 12h=30% off 24h; children 13+ ₹500/night

## Known fixes applied
- CORS allows PATCH (and PUT/DELETE/OPTIONS)
- Admin endpoints require authentication (no `optionalAuth`)
- GET `/api/bookings` no longer leaks by email to unauthenticated callers
- `.env.example` sanitized (placeholders only; rotate real secrets if exposed)
- Guest booking no longer falls back to first customer
- Migration runner supports ordered execution, transaction per file, advisory lock, direct non-pooler connection; handles legacy 001 compat
- `users.status` enforced in auth middleware (migration 002)
- Admin payment decision endpoint: `POST /api/admin/bookings/:idOrRef/payment/verify` (approve/reject with required reason; reject reopens booking and resets hold)
- Guest booking linking endpoint: `POST /api/bookings/:idOrRef/link` (matches guest email/phone, sets `user_id`; 403 on mismatch, 409 if already linked)
- Frontend payment status no longer hardcoded to "paid": helpers `isPaymentSettled`/`getPaymentStatusLabel` drive all admin/guest payment badges; admin console can verify/reject UTRs and shows the submitted reference
