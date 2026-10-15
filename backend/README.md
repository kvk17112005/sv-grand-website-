# SV Grand API (Backend)

Secure Express + PostgreSQL backend for SV Grand Luxury Rooms (Tadipatri, AP, India). Raw SQL (no ORM), sessions, CSRF, rate limiting, zod validation. Manual UPI payments with admin verification.

## Features
- Hybrid inventory (room-type allotment + physical room assignment) with btree_gist exclusion
- Unified booking state machine + payment state
- Guest checkout (nullable user + guests table)
- REQ-XXXX pending reference → SVG-XXXXXX at approval
- Pricing 12h/24h, extra guests, coupons, add-ons, tax configurable (0)
- Admin approval, UTR submission, payment verification
- Catalog, availability, bookings, admin endpoints

## Quick Start (local)
1. Copy `.env.example` to `.env` and fill values (Neon URLs, FRONTEND_ORIGIN http://localhost:5173, SESSION_SECRET).
2. `npm install`
3. `npm run db:migrate` (to live DB) or ensure test DB exists.
4. `npm run dev`

## Scripts
- `dev` — node --watch
- `start` — production start
- `db:migrate` — ordered migrations
- `db:seed-accounts` — seed default accounts
- `admin:promote` — promote user
- `test` — node:test against `DATABASE_URL_TEST` (isolated)

## Default accounts (seed)
user@svgrand.com / hoteladmin@svgrand.com / superadmin@svgrand.com with password `Password@123`. Change in production.

## Endpoints
See [API.md](API.md). Frontend uses these; CSRF required for writes.

## Testing
34 tests cover auth, booking lifecycle, inventory/overbooking, pricing, manual UPI payment verification (approve/reject/reopen), guest-account linking, and security (no email leak, admin auth, CSRF, CORS PATCH). Run `npm test`.

## Migrations
001-009 applied safely to live DB. Runner: transaction per file, `pg_advisory_lock`, direct non-pooler for lock safety.

## Security notes
- No secrets in `.env.example`
- Auth filters by `users.status='active'`
- Admin endpoints locked down
- Unauthenticated `/api/bookings` returns empty
- PATCH in CORS
- Parameterized SQL
