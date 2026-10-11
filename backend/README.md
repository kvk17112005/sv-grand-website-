# SV Grand API

Node.js API for customer accounts, secure sessions, bookings, and management dashboards.

## Configure and run

1. Use Node.js 20.6 or newer.
2. Run `npm install` in this directory.
3. Copy `.env.example` to `.env`. Set `DATABASE_URL` to the rotated Neon connection string, generate a unique random `SESSION_SECRET` of at least 32 characters, and set `FRONTEND_ORIGIN` to the exact frontend origin.
4. Run `npm run db:migrate` once against the intended Neon database.
5. Run `npm run start` to start the API. Use `npm run dev` for local development.
6. In `frontend/.env`, set `VITE_API_BASE_URL` to the API origin, then restart Vite.

For a frontend and API deployed on different sites, configure `COOKIE_SAME_SITE=none`, use HTTPS for both, and set `NODE_ENV=production`. For local development, use `COOKIE_SAME_SITE=lax`.

## Create privileged staff

Register a normal customer account first, then run:

```sh
npm run admin:promote -- staff@example.com admin
npm run admin:promote -- owner@example.com super_admin
```

Only this database-backed operator command can grant staff roles. Public registration never accepts a role. The API checks current database roles on each protected request; frontend route guards are only for navigation and are not the authorization boundary.

The migration creates `users`, `user_sessions`, `bookings`, and `schema_migrations`. Passwords are stored as bcrypt hashes. Aadhaar values are not stored or sent to this API. Booking totals are recalculated from the server room catalog.
