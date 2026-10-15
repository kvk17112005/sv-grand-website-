# AGENTS.md — SV Grand Luxury Rooms

Guide for agents working in this repo: what the project is, how to run and test
it, the architecture rules that must not be broken, and the payment/booking plus
admin/super-admin console work that has been completed.

## Project

Hotel booking site for **SV Grand Luxury Rooms** (Tadipatri, Andhra Pradesh, India).

- `backend/` — Express 5 (ESM) + PostgreSQL (raw SQL, no ORM), sessions, CSRF, rate limiting, zod validation. Package `sv-grand-api`. Entry `src/server.js`, app in `src/app.js`.
- `frontend/` — React 19 + Vite 8 (rolldown), Tailwind 4. Mixed `.jsx` and `.tsx`; **no `tsc`** in the toolchain (Vite strips types, it does not type-check). `src/services/api.js` has the `apiRequest` fetch helper.
- `backend/docs/` — authoritative design docs: `DECISIONS.md`, `API.md`, `SCHEMA.md`, `STATE_MACHINE.md`, `PRICING.md`, `ER_DIAGRAM.md`, `DEPLOY_NEON.md`.

## Commands

Backend (run in `backend/`; scripts use `node --env-file=.env`):

```
npm run dev              # watch server
npm run start            # production start
npm run db:migrate       # apply ordered migrations
npm run db:seed-accounts # seed default accounts
npm run admin:promote -- <email>   # promote a user
npm test                 # node:test against DATABASE_URL_TEST (isolated)
```

Frontend (run in `frontend/`):

```
npm run dev
npm run lint             # eslint — the effective quality gate (no tsc)
npm run build
```

Always run `npm run lint` in `frontend/` and `npm test` in `backend/` after changes.

## Environment

Backend `.env` (see `backend/.env.example`; copy it, never commit `.env`):
`DATABASE_URL`, `MIGRATION_DATABASE_URL` (direct/non-pooler, migrations + tests),
`DATABASE_URL_TEST` (separate Neon DB, **never** point at live data), `PORT`,
`NODE_ENV`, `FRONTEND_ORIGIN`, `SESSION_SECRET`, `COOKIE_SAME_SITE`.

Frontend `.env`: `VITE_API_BASE_URL` (default `http://localhost:3001`).

## Non-negotiable architecture rules

These come from the agreed product decisions in `backend/docs/DECISIONS.md`.

1. **Payments — manual UPI, admin-verified only.** No payment gateway. Guests
   pay to UPI ID `3341101017051@cnrb` (payee `Kummara Papamma`, QR at
   `frontend/public/payment-qr.jpeg`) and submit the UTR. **A client submission
   or screenshot can never mark a payment verified** — only an admin decision can.
   `pay_at_hotel` is also allowed.
2. **Guest checkout.** `bookings.user_id` is nullable and guests live in the
   `guests` table. Never attach an anonymous booking to "the first customer".
   A guest booking is linked to an account only through the ownership-checked
   link endpoint (email/phone must match).
3. **Hybrid inventory.** Reserve by room type at booking (counts against
   availability while holding/blocking) inside concurrency-safe transactions;
   assign a physical room later. Active physical-room overlaps are prevented by a
   `btree_gist` exclusion constraint. Cancelled/expired bookings release inventory.
4. **One booking state machine.** `pending_payment → payment_verification →
   confirmed → checked_in → checked_out`, with branches `cancelled`, `no_show`.
   Payment status is tracked separately from booking status. Human short code
   `REQ-XXXX` while pending; `SVG-XXXXXX` assigned at admin approval.
5. **Taxes.** `tax_percentage = 0` for now and tax is **not** shown in guest
   totals. Legal verification is required before enabling GST.
6. **Testing.** `node:test` + `node:assert` against the isolated test DB
   (`DATABASE_URL_TEST`). Cover unit, integration, authorization, migration, and
   concurrency. Never run destructive tests against production data.
7. **Multi-hotel scoping.** Keep `hotel_id` on hotel-owned tables; exactly one
   hotel is seeded (SV Grand Luxury Rooms). Enforce ownership in the DB and the API.

## Payment + booking flows (implemented)

Endpoints (full list in `backend/docs/API.md`):

- `POST /api/bookings` — create pending booking (guest or authenticated).
- `POST /api/bookings/:idOrRef/payment` — guest submits UPI UTR →
  booking `payment_verification`, paymentStatus `reference_submitted`.
- `POST /api/bookings/:idOrRef/link` — authenticated; links a guest booking to
  the account when guest email/phone matches. `403` mismatch, `409` already
  linked to another account. Implemented in
  `backend/src/services/bookings.js::linkBookingToUser`.
- `POST /api/admin/bookings/:idOrRef/payment/verify` — admin decision
  (`backend/src/services/payments.js::verifyPayment`):
  - approve → payment `verified`, booking paymentStatus `verified`.
  - reject (reason **required**) → payment/booking `rejected`, booking returns to
    `pending_payment`, `holdExpiresAt` reset from
    `hotel_settings.hold_expiry_minutes`, and a `booking_status_history` row is
    written.

Plumbing: `idOrRef` is resolved by `resolveBookingId` in
`backend/src/routes/admin.js` (accepts DB id, SVG code, or REQ reference).

Frontend payment status is never hardcoded: use `isPaymentSettled()` and
`getPaymentStatusLabel()` from `frontend/src/types/hotel.ts`. The admin console
(`AdminBookingVerification.tsx`) shows the submitted UTR and Verify/Reject
buttons, calling `reviewPayment()` from `HotelContext`.

## Admin / super-admin backend (implemented)

All routes live in `backend/src/routes/admin.js` (mounted under `/api/admin`),
behind `authenticated` + `requireRole("admin", "super_admin")`. Endpoints marked
**(super)** additionally require `requireRole("super_admin")`. Writes need CSRF.
`idOrRef` is resolved by `resolveBookingId` (DB id, `SVG-...`, or `REQ-...`).

Front-desk / admin:

- `GET /api/admin/rooms` — list physical rooms (`serializeRoom` shape).
- `PATCH /api/admin/rooms/:roomNumber/status` — operational/housekeeping status,
  notes, `assignedHousekeeper`; logs `room_status_history`.
- `POST /api/admin/bookings/:idOrRef/check-in` — assigns/occupies a room and
  transitions `confirmed → checked_in` (optional desk payment).
- `POST /api/admin/bookings/:idOrRef/check-out` — `checked_in → checked_out`,
  room → `cleaning`/`dirty`.
- `POST /api/admin/bookings/:idOrRef/payment/collect` — record an at-desk
  payment as verified (admin-only decision).
- `GET|POST /api/admin/guest-requests`, `PATCH /api/admin/guest-requests/:id` —
  guest request board (scoped by `hotel_id`).

Super-admin only:

- `GET|POST /api/admin/staff`, `PATCH|DELETE /api/admin/staff/:id` — staff CRUD.
- `GET|POST /api/admin/offers`, `PATCH|DELETE /api/admin/offers/:id` — offers
  CRUD (delete falls back to deactivate when FK-referenced).
- `GET /api/admin/room-types/pricing`, `PATCH /api/admin/room-types/:id/pricing`
  — replace active `room_type_rates` and set `discount_percentage`.
- `GET /api/admin/reviews`, `PATCH /api/admin/reviews/:id` (moderate),
  `POST /api/admin/reviews/:id/response` (manager response).
- `PATCH /api/admin/settings` — hotel + `hotel_settings` (tagline, GST number,
  wizard discount). Returns the public catalog **after commit**.
- `GET /api/admin/analytics` — bookings/revenue/ADR/occupancy/revPAR/payment
  breakdown/monthly revenue.

Services: `backend/src/services/rooms.js`, `frontdesk.js`, `guestRequests.js`,
`staff.js`, `offers.js`, `pricingAdmin.js`, `reviews.js`, `settings.js`,
`analytics.js`. Zod inputs in `backend/src/lib/schemas.js` (`roomStatusInput`,
`checkInInput`, `paymentCollectInput`, `guestRequestInput`,
`guestRequestUpdateInput`, `staffInput`, `staffUpdateInput`, `offerInput`,
`offerUpdateInput`, `reviewModerationInput`, `reviewResponseInput`,
`roomTypePricingInput`, `hotelSettingsInput`).

Note: `services/staff.js::listStaff` (the `staff` table) is distinct from
`services/admin.js::getStaff` (users with role admin/super_admin).

## Data / migrations

`backend/migrations/001..010`. Runner: one transaction per file,
`pg_advisory_lock`, direct (non-pooler) connection. `payments`/`refunds` live in
`007_payments.sql`; GST config + `hotel_settings` seed in `002_foundation.sql`;
guests/bookings in `004_guests_bookings.sql`; staff/guest_requests in
`008_operations.sql`; reviews/responses in `009_engagement.sql`;
`010_admin_ops.sql` adds `physical_rooms.assigned_housekeeper`,
`guest_requests.guest_name` + `guest_requests.hotel_id`, `hotels.tagline`,
`hotel_settings.gst_number` + `wizard_discount_percentage`.

## Tests

`backend/test/` — `run.js` executes suites against `DATABASE_URL_TEST`.
Support helpers in `test/support/` (`app.js`, `client.js` with `get/post/put/
patch/del`, `db.js` with `resetAndMigrate`). Coverage:
`test/payments.test.js` (verify/reject, reject reopens booking, reason required,
verify without payment, link match/mismatch) and `test/admin-ops.test.js` (rooms
status, check-in/out, collect payment, guest requests, staff CRUD + role gating,
offers, room-type pricing, review moderation/response, settings, analytics).
**Current: 44 tests, all passing.**

## Conventions

- Backend ESM, parameterized SQL only, services in `src/services/`, HTTP in
  `src/routes/`, validation schemas in `src/lib/schemas.js`.
- Writes require CSRF (`X-CSRF-Token`); admin routes require an admin/super_admin
  session. Keep authorization checks server-side.
- Frontend: prefer the existing `apiRequest` helper; keep the backend as source
  of truth. The frontend still has a localStorage prototype path — do not rely on
  it for correctness.

## Known gaps / follow-ups

- No guest-facing UI to trigger booking→account linking yet (backend only).
- Admin/super-admin **frontend wiring** is not done yet — the console components
  still use context stubs / localStorage. Backend endpoints are ready (see above).
- Some legacy localStorage booking flows still coexist with the backend flow.
- Pre-existing stale/inaccurate seed data in old migrations (reports/menu) —
  safe to ignore unless that area is being changed.
- GST stays disabled (0%) pending legal verification.

---

# Project progress & work log

Status of the agreed redesign. Update this section as work lands so progress is
easy to track. Legend: ✅ done & verified, 🟡 partial / backend-only, ⛔ blocked.

## Status overview

| Area | Status | Notes |
| --- | --- | --- |
| Manual UPI payments (no gateway) | ✅ | `upi` + `pay_at_hotel`; UTR submission; admin verification only |
| Admin verify / reject payment | ✅ | `POST /api/admin/bookings/:idOrRef/payment/verify`; reject requires reason |
| Guest checkout (nullable user) | ✅ | `guests` table; no first-customer fallback |
| Guest → account linking (API) | ✅ | `POST /api/bookings/:idOrRef/link`; ownership-checked |
| Guest → account linking (UI) | 🟡 | Backend + context action only; no guest-facing button yet |
| Hybrid inventory + physical rooms | ✅ | room-type hold/block + `btree_gist` exclusion; release on cancel/expire |
| Booking state machine | ✅ | single machine, separate payment status, REQ→SVG codes |
| Taxes / GST | ✅ | `tax_percentage = 0`, hidden in guest totals; enabling needs legal sign-off |
| Multi-hotel scoping (`hotel_id`) | ✅ | one hotel seeded (SV Grand Luxury Rooms) |
| Isolated test DB + `node:test` | ✅ | `DATABASE_URL_TEST`; 44 tests passing |
| Frontend payment status (no hardcoding) | ✅ | `isPaymentSettled()` / `getPaymentStatusLabel()` |
| Admin console payment UI | ✅ | shows UTR + Verify/Reject buttons |
| Admin/super-admin backend endpoints | ✅ | rooms, check-in/out, collect, guest requests, staff, offers, pricing, reviews, settings, analytics (see above) |
| Admin/super-admin frontend wiring | 🟡 | backend ready; console components still on context stubs |
| Frontend lint / build | ✅ | `npm run lint` clean; `npm run build` OK |
| Frontend type-checking | ⛔ | no `tsc` in toolchain (Vite strips types); lint is the only gate |
| Guest link UI, legacy localStorage cleanup | 🟡 | pending follow-up |

## Work log (chronological)

1. **Audit** — reviewed the codebase against the 7 decisions in
   `backend/docs/DECISIONS.md`. Confirmed manual UPI (no gateway), GST 0%,
   multi-hotel `hotel_id`, unified state machine, and inventory release all
   existed; gaps were payment verification, guest linking, and frontend status.
2. **Payment verification (backend)** — rewrote
   `backend/src/services/payments.js::verifyPayment`:
   - approve → payment `verified`, booking `payment_status='verified'`.
   - reject (reason required) → payment/booking `rejected`, booking returns to
     `pending_payment`, `hold_expires_at` reset from
     `hotel_settings.hold_expiry_minutes`, and a `booking_status_history` row is
     inserted. Errors when no payment has been submitted.
   - Added route `POST /api/admin/bookings/:idOrRef/payment/verify` in
     `backend/src/routes/admin.js` (`paymentDecisionInput` zod schema).
3. **Guest → account linking (backend)** — added
   `backend/src/services/bookings.js::linkBookingToUser` (matches guest
   email/phone, sets `user_id`; `403` mismatch, `409` already linked) and route
   `POST /api/bookings/:idOrRef/link` in `backend/src/routes/bookings.js`
   (authenticated + CSRF + writeLimiter). Restored a deleted
   `getBookingByReference` body in the same pass.
4. **Tests** — added `backend/test/payments.test.js` (6 cases: approve; reject
   reopens booking + records reason + allows resubmit; reject without reason →
   400; verify with no payment → 400; link match → 200; link mismatch → 403).
   Suite count 28 → **34, all passing**.
5. **Frontend status model** — extended `frontend/src/types/hotel.ts`
   (`BookingStatus`, `PaymentStatus`, `PaymentMethod`, `BookingPayment`) and added
   `isPaymentSettled()` / `getPaymentStatusLabel()`. Updated
   `HotelContext.tsx::normalizeBackendBooking` (correct status mapping, default
   `awaiting_payment`) and removed hardcoded `'paid'` defaults.
6. **Frontend payment UI** — replaced hardcoded "PAID VERIFIED" labels with the
   helpers in `AdminBookingVerification.tsx`, `BookingsManager.tsx`,
   `MyBookings.jsx`, `BookingSuccessModal.tsx`; added a `reviewPayment()` context
   action and Verify/Reject buttons + UTR display in the admin console.
7. **Checkout backend integration** — `BookingCheckoutModal.tsx` now POSTs to
   `/api/bookings` first, removes fabricated PII defaults and fake
   `paymentStatus:'paid'`, and restricts methods to UPI + Pay at Hotel.
8. **Quality gate** — `frontend` lint cleaned (unused imports / effect-state
   rule in `MyBookings.jsx`, unused `formatDate` in `BookingConfirmation.jsx`);
   build succeeds; `backend` tests green.
9. **Docs** — updated `backend/docs/API.md` (new link + payment/verify
   endpoints), `backend/README.md` (34 tests), `backend/docs/DECISIONS.md`
   (applied fixes), and created this `AGENTS.md`.
10. **Admin / super-admin backend** — mapped every console component to an
    endpoint, then added migration `010_admin_ops.sql` (room housekeeper,
    `guest_requests.guest_name` + `hotel_id`, `hotels.tagline`,
    `hotel_settings.gst_number` + `wizard_discount_percentage`), 13 zod schemas,
    and services `rooms.js`, `frontdesk.js`, `guestRequests.js`, `staff.js`,
    `offers.js`, `pricingAdmin.js`, `reviews.js`, `settings.js`, `analytics.js`.
11. **Route wiring** — registered all new endpoints in `routes/admin.js` with a
    `requireSuper` guard (`requireRole("super_admin")`); admins get front-desk
    routes, super-admins get staff/offers/pricing/reviews/settings/analytics.
12. **Bug fixes found by tests** — repaired a duplicated `services/admin.js`
    (duplicate `const pool`), removed nested-transaction deadlocks in
    `frontdesk.js` (check-in/out/collect now run sequential queries instead of
    `transitionBooking` inside another transaction), fixed the post-commit read
    in `settings.js` (`getPublicCatalog()` moved outside the transaction), fixed
    `room_type_rates` effective-dating in `pricingAdmin.js`, and corrected
    `analytics.js` to read refunds from the `refunds` table and the payment
    breakdown from `payments` (the old `bookings.refund_amount` /
    `payment_method` columns never existed).
13. **Tests** — added `backend/test/admin-ops.test.js` (10 cases) and a `del`
    helper in `test/support/client.js`. Suite count 34 → **44, all passing**.
    (The admin/super-admin **frontend** wiring is intentionally left for the next
    pass.)

## How to verify the current state

```
# backend — 44/44 expected
cd backend && npm test

# frontend — no eslint errors, clean build expected
cd frontend && npm run lint && npm run build
```

Key files to inspect: `backend/src/services/payments.js`,
`backend/src/services/bookings.js`, `backend/src/services/frontdesk.js`,
`backend/src/services/pricingAdmin.js`, `backend/src/services/analytics.js`,
`backend/src/routes/admin.js`, `backend/src/routes/bookings.js`,
`backend/src/lib/bookingState.js`, `backend/migrations/010_admin_ops.sql`,
`backend/test/payments.test.js`, `backend/test/admin-ops.test.js`,
`frontend/src/types/hotel.ts`, `frontend/src/context/HotelContext.tsx`,
`frontend/src/components/outlineHotelAdmin/`,
`frontend/src/components/outlineSuperAdmin/`.

## Remaining TODO (suggested order)

1. Wire the admin/super-admin frontend `HotelContext` actions and console
   components to the endpoints documented above (replace context stubs /
   localStorage); run `npm run lint` + `npm run build`.
2. Add guest-facing UI to link an existing booking to an account (uses
   `POST /api/bookings/:idOrRef/link`).
3. Retire the legacy localStorage booking path once the backend flow covers all
   guest screens.
4. Promote a real admin and smoke-test the UPI verify/reject round trip against a
   staging DB.
5. Enable a real `tsc` type-check step in the frontend toolchain (optional but
   recommended).
6. Only after legal verification: enable GST (`tax_percentage > 0`) and show tax
   in guest totals.

## Session handoff (latest — resume here)

State: **backend for admin/super-admin panels complete and green (44/44).**
Nothing is committed yet; all work is uncommitted in the working tree.

Landed this session:

- `backend/migrations/010_admin_ops.sql` — room housekeeper, `guest_requests.guest_name`
  + `guest_requests.hotel_id`, `hotels.tagline`, `hotel_settings.gst_number` +
  `wizard_discount_percentage`.
- `backend/src/lib/schemas.js` — 13 admin/super-admin zod inputs.
- New services: `rooms.js`, `frontdesk.js`, `guestRequests.js`, `staff.js`,
  `offers.js`, `pricingAdmin.js`, `reviews.js`, `settings.js`, `analytics.js`.
- `backend/src/services/admin.js` — rewritten clean (was duplicated; now
  `getOverview` / `getStaff` / `findBookingForVerification`).
- `backend/src/routes/admin.js` — all new routes registered with `requireSuper`
  (super-admin) vs admin front-desk split.
- `backend/src/services/catalog.js` — `getHotelContext` now selects `tagline`,
  `gst_number`, `wizard_discount_percentage`.
- `backend/test/admin-ops.test.js` (10 cases) + `del` helper in
  `test/support/client.js`.
- Docs: this file, `backend/README.md` (44 tests), `backend/docs/*`.

Bug fixes found by tests: duplicated `services/admin.js`; nested-transaction
deadlocks in `frontdesk.js`; pre-commit `getPublicCatalog()` read in
`settings.js`; `room_type_rates` effective-dating in `pricingAdmin.js`;
`analytics.js` reading `bookings.refund_amount`/`payment_method` (never existed →
now reads `refunds` + `payments`).

Verification: `cd backend && npm test` → **44/44 pass**.
Test env note: `npm test` (via `test/run.js`) sets `DATABASE_URL=DATABASE_URL_TEST`.
Running `node --test` directly needs that env manually, otherwise it hits the live DB.

Next up (frontend, not started): wire `frontend/src/context/HotelContext.tsx`
actions + `outlineHotelAdmin/` + `outlineSuperAdmin/` components to the endpoints
in the "Admin / super-admin backend (implemented)" section above. Then
`cd frontend && npm run lint && npm run build`.

Gotcha to remember: migration runner discovers `migrations/*.sql` automatically
(sort order), and `test/support/db.js::resetAndMigrate` drops `public` and replays
all of them, so 010 is picked up with no code changes.
