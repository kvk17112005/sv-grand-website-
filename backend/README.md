# SV Grand API (Backend)

Secure Express + PostgreSQL backend for SV Grand Luxury Rooms (Tadipatri, AP, India). Raw SQL (no ORM), sessions, CSRF, rate limiting, zod validation. Server-priced UPI intents remain pending until a trusted payment provider callback is verified.

## Features
- Hybrid inventory (room-type allotment + physical room assignment) with btree_gist exclusion
- Unified booking state machine + payment state
- Guest checkout (nullable user + guests table)
- REQ-XXXX pending reference → SVG-XXXXXX at approval
- Pricing 12h/24h, extra guests, coupons, add-ons, tax configurable (0)
- Server-priced UPI intents, idempotent retries, signed payment webhook processing
- Admin payment status, transaction reference, and booking confirmation visibility
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
Tests cover auth, booking lifecycle, inventory/overbooking, pricing, manual UPI review, idempotent UPI intents, signed callback verification, payment status transitions, duplicate callbacks, guest-account linking, and security. Run `npm test`.

## UPI verification setup

`UPI_MERCHANT_ID` defaults to the existing Canara Bank VPA and is only read by
the backend. The UPI intent uses the active hotel's name from the database as
the payee name. A native UPI deep link is only a payment request; with no
provider callback integration configured, its state remains `pending` and no
booking is confirmed automatically.

The repository has no Canara Bank API credentials or official bank connector,
and the merchant account's API/webhook capabilities cannot be determined from
application code. Contact Canara Bank's merchant/acquiring support to confirm
whether this specific merchant account supports payment status APIs or
webhooks. If it does, implement/use the bank's documented adapter, map verified
transactions to the intent's payment ID and booking reference, and configure
the provider's signed callback. Do not point a provider's incompatible native
webhook directly at this generic contract.

The generic callback endpoint is `POST /api/payments/webhook`. It is disabled
unless `PAYMENT_WEBHOOK_SECRET` is set. A trusted adapter/relay must HMAC-SHA256
the exact raw JSON body using that secret and send
`X-Payment-Signature: sha256=<hex>`. The payload contract and required
amount/currency/booking/transaction checks are documented in [API.md](docs/API.md).
Keep all provider credentials and the webhook secret on the backend.

## Migrations
001-009 applied safely to live DB. Runner: transaction per file, `pg_advisory_lock`, direct non-pooler for lock safety.

## Security notes
- No secrets in `.env.example`
- Auth filters by `users.status='active'`
- Admin endpoints locked down
- Unauthenticated `/api/bookings` returns empty
- PATCH in CORS
- Parameterized SQL
