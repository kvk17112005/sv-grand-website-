# Schema
      
This document describes the relational schema for SV Grand Luxury Rooms (PostgreSQL).

## Core

- `hotels` — single hotel (seed: SVGRAND-TPT)
- `hotel_settings` — check-in/out times, tax, extra guest charge, hold expiry, UPI config (id, payee, QR), policies
- `users` — id, name, email, phone, password_hash, role (customer/admin/super_admin), status, last_login_at, email_verified, created_at, updated_at
- `user_sessions` — express-session via connect-pg-simple

## Inventory
- `room_types` — code (single_ac, single_non_ac, double_ac, double_non_ac), name, is_ac, bedroom_type (single/double), capacity, rates metadata
- `room_type_rates` — (room_type_id, stay_duration 12/24, amount, effective_from/to)
- `amenities`, `room_type_amenities`, `room_images`
- `physical_rooms` — each bookable room (room_number, floor, room_type_id, operational_status, housekeeping_status, btree_gist used for exclusion)
- `room_status_history` — audit of physical room status

## Bookings
- `bookings` — hybrid model. `user_id` nullable (guest checkout). `guest_id` FK to guests. `booking_id` (SVG-XXXXXX) generated at admin approval; `request_reference` (REQ-XXXX) is the pending handle. `status` in {pending_payment,payment_verification,confirmed,checked_in,checked_out,cancelled,no_show}. `payment_status` separate. `hotel_id`, `room_type_id`, `room_type`, `room_name`, dates, guests, pricing (numeric 12,2), tax, coupon_id, assigned_room_id, hold_expires_at, timestamps. `stayin` dates are dates; `stay_duration` (12/24). `nights`=1 for 12h typically.
- `booking_rooms` — room-type allotment per booking with `daterange(stay)` and `is_active`. Exclusion constraint prevents overlapping active physical room assignments. Trigger syncs is_active from bookings.status.
- `booking_status_history` — immutable transition log
- `guests` — guest record (name/email/phone, optional link to user)

## Payments (manual UPI)
- `payments` — booking_id, method (upi/pay_at_hotel), utr, upi_id, screenshot_url, status (awaiting_payment/reference_submitted/verified/rejected), submitted_at, verified_by, verified_at
- `refunds` — manual refunds

## Operations
- `staff`, `staff_shifts`, `housekeeping_tasks`, `maintenance_tickets`, `guest_requests`, `guest_request_updates`

## Marketing & Engagement
- `offers` (coupons), `coupon_redemptions`
- `add_on_services`, `booking_add_ons`
- `reviews`, `review_responses`, `notifications`, `audit_logs`
- `schema_migrations`

## Constraints
- Exclusion: active booking_rooms with physical_room_id assigned cannot overlap in `stay` (btree_gist).
- Check constraints on statuses, stay_duration (12/24), payment_method/status, numeric bounds.
- Indexes for performance (status, dates, email, room_type).
- `pg_advisory_lock` used by migration runner to prevent concurrent migrations.

## Notes
- No GST stored/charged (tax_percentage=0). Legal verification required.
- Backwards-compatible: legacy bookings migrated to new shape.
- Test isolation: second Neon DB `sv_grand_test`.
