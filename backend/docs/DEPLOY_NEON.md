# Deployment (Neon)

## Databases
- Primary: `sv_grand` (Neon Postgres)
- Test (isolated): `sv_grand_test`
- Migrations use direct non-pooler connection: `MIGRATION_DATABASE_URL` (hostname without `-pooler`) for advisory lock safety. App uses pooled `DATABASE_URL`.

## Environment (`backend/.env`)
```env
NODE_ENV=production
DATABASE_URL=postgresql://... (pooled)
MIGRATION_DATABASE_URL=postgresql://... (direct, no -pooler)
DATABASE_URL_TEST=postgresql://.../sv_grand_test (or derive)
FRONTEND_ORIGIN=https://your-frontend-origin
SESSION_SECRET=<min-32-characters>
COOKIE_SAME_SITE=lax (or none+HTTPS)
PORT=3001
```
Generate a new `SESSION_SECRET` (do not reuse the previously committed one). If a production secret was ever exposed, rotate it and invalidate sessions.

## Migrations
```bash
cd backend
npm run db:migrate
```
The runner applies migrations in sorted order 001-009. Each in its own transaction. Uses `pg_advisory_lock` to prevent races. Skips already-applied versions.

## Seeds & Admin
- `npm run db:seed-accounts` seeds default accounts (user@svgrand.com, hoteladmin@svgrand.com, superadmin@svgrand.com) with password `Password@123` (change in production).
- `npm run admin:promote` to elevate users.

## Frontend
Set `VITE_API_BASE_URL=https://your-backend-url` in frontend `.env` (or build env).

## Security Notes
- CSRF tokens on all writes
- Rate limits on auth/lookup/write
- CORS restricts origins; PATCH allowed
- Admin endpoints require proper roles
- Session cookies HttpOnly; Secure in production if SameSite=None
- `users.status='active'` enforced
- SQL parameterized; no raw concatenation of user input
- Sensitive endpoints never trust email from unauthenticated requests

## Health check
`GET /api/health` returns `{status:"ok"}`. Ping after deploy.

## Local dev
```bash
cd backend
npm run dev  # watches src
# in another terminal
cd frontend
npm run dev
```
Tests: `cd backend && npm test` (runs against `sv_grand_test`).
