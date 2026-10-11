# SV Grand frontend

React and Vite frontend for SV Grand Luxury Rooms.

## Run locally

```sh
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to the HTTPS origin of the app's backend before signing in, registering, viewing bookings, or opening management data. The frontend sends requests with cookies enabled; the backend must allow the deployed frontend origin and credentialed requests.

See [the backend setup guide](../backend/README.md) for migration, API, and staff provisioning steps.

## Backend API contract

The frontend expects JSON responses and cookie-based sessions:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/session` | Return `{ "user": { "id", "name", "email", "phone", "role" } }`; return `{ "user": null }` when signed out |
| `POST` | `/api/auth/login` | Accept `{ "email", "password" }`; return `{ "user": ... }` and set a secure session cookie |
| `POST` | `/api/auth/register` | Accept `{ "name", "email", "phone", "password" }`; return `{ "user": ... }` and set a session cookie |
| `POST` | `/api/auth/logout` | Revoke the session and clear its cookie |
| `PUT` | `/api/account/profile` | Accept `{ "name", "phone" }`; return `{ "user": ... }` |
| `GET` | `/api/bookings?scope=mine` | Return `{ "bookings": [...] }` for the authenticated user |
| `POST` | `/api/bookings` | Create a booking for the authenticated user and return the saved booking |
| `GET` | `/api/admin/overview` | Return authorized management metrics, bookings, and customers |

The admin overview response contains `stats` (`bookings`, `customers`, `upcomingBookings`, `revenue`), `bookings`, and `customers`. Super-admin responses also contain `staff`. Booking records include `bookingId`, `guestName` (or `name`), `email`, `roomName`, `checkIn`, `checkOut`, `status`, `grandTotal`, and, for customer records, `totalGuests` and `nights`. Customer records include `id`, `name`, `email`, `phone`, `bookingCount`, and `createdAt`. Staff records include `id`, `name`, `email`, `role`, and `createdAt`.

Use only the server-assigned roles `customer`, `admin`, and `super_admin`. Public registration must never allow a caller to select a privileged role. The backend must authenticate every request, derive booking ownership from the session (not submitted email or user ID), enforce admin/super-admin authorization on the server, and return only fields each role is allowed to see. Use HTTPS and `HttpOnly`, `Secure`, `SameSite` session cookies; apply CSRF protection to state-changing requests.

The server validates the room catalog, current room pricing, guest counts, dates, and totals before accepting a booking. Never trust client-calculated prices or amounts. Add room-inventory availability checks when individual room inventory is connected.

The frontend intentionally does not store passwords, session tokens, or authoritative roles in browser storage. Without a configured backend it displays the connection/configuration error instead of creating a fake local account.

## Scripts

- `npm run dev` — start the Vite development server.
- `npm run build` — create a production build.
- `npm run lint` — run ESLint.
