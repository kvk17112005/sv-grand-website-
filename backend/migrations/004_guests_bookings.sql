-- 004_guests_bookings: guest records, rich booking fields, allotments, status history.
-- Preserves the 5 existing live bookings. Runner wraps this in a transaction.

-- ---------------------------------------------------------------------------
-- Guests (supports guest checkout; user_id is optional until account linking).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guests_email_idx ON guests (LOWER(email));
CREATE INDEX IF NOT EXISTS guests_user_idx ON guests (user_id);

-- ---------------------------------------------------------------------------
-- Extend bookings.
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE bookings
  ALTER COLUMN price TYPE numeric(12,2),
  ALTER COLUMN room_total TYPE numeric(12,2),
  ALTER COLUMN extra_guest_total TYPE numeric(12,2),
  ALTER COLUMN grand_total TYPE numeric(12,2);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES hotels(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_type_id uuid REFERENCES room_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS stay_duration integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS assigned_room_id uuid REFERENCES physical_rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS special_requests text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_percentage numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'awaiting_payment',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS request_reference text,
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- Backfill existing rows before tightening constraints.
-- ---------------------------------------------------------------------------
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

UPDATE bookings SET request_reference = booking_id WHERE request_reference IS NULL;
UPDATE bookings SET hotel_id = '11111111-1111-1111-1111-111111111111' WHERE hotel_id IS NULL;
UPDATE bookings
   SET room_type_id = CASE
     WHEN lower(room_name) LIKE '%non-ac%' AND lower(room_name) LIKE '%single%'
       THEN 'a0000000-0000-0000-0000-000000000002'::uuid
     WHEN lower(room_name) LIKE '%non-ac%'
       THEN 'a0000000-0000-0000-0000-000000000004'::uuid
     WHEN lower(room_name) LIKE '%single%'
       THEN 'a0000000-0000-0000-0000-000000000001'::uuid
     ELSE 'a0000000-0000-0000-0000-000000000003'::uuid
   END
 WHERE room_type_id IS NULL;

UPDATE bookings SET status = 'pending_payment' WHERE status = 'pending';
UPDATE bookings SET payment_status = 'verified' WHERE status IN ('confirmed', 'checked_in', 'checked_out');
UPDATE bookings SET confirmed_at = created_at WHERE status IN ('confirmed', 'checked_in', 'checked_out') AND confirmed_at IS NULL;

-- Create a guest row per distinct existing booking email, then link.
INSERT INTO guests (user_id, name, email, phone)
SELECT DISTINCT ON (lower(coalesce(b.guest_email, '')))
       b.user_id, b.guest_name, b.guest_email, b.guest_phone
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM guests g WHERE lower(coalesce(g.email, '')) = lower(coalesce(b.guest_email, ''))
)
ORDER BY lower(coalesce(b.guest_email, '')), b.created_at;

UPDATE bookings b
   SET guest_id = g.id
  FROM guests g
 WHERE b.guest_id IS NULL
   AND lower(coalesce(b.guest_email, '')) = lower(coalesce(g.email, ''));

-- ---------------------------------------------------------------------------
-- Tighten constraints now that data is valid.
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending_payment', 'payment_verification', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_stay_duration_check') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_stay_duration_check CHECK (stay_duration IN (12, 24));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_payment_status_check') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
      CHECK (payment_status IN ('awaiting_payment', 'reference_submitted', 'verified', 'rejected', 'pay_at_hotel', 'refunded'));
  END IF;
END $$;

ALTER TABLE bookings ALTER COLUMN request_reference SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_request_reference_key') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_request_reference_key UNIQUE (request_reference);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_dates_idx ON bookings (check_in, check_out);
CREATE INDEX IF NOT EXISTS bookings_guest_email_idx ON bookings (LOWER(guest_email));
CREATE INDEX IF NOT EXISTS bookings_guest_id_idx ON bookings (guest_id);
CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Booking room allotments (room-type reservation + later physical assignment).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  physical_room_id uuid REFERENCES physical_rooms(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  stay daterange NOT NULL,
  nightly_rate numeric(12,2) NOT NULL DEFAULT 0,
  room_total numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_rooms_type_idx ON booking_rooms (room_type_id);
CREATE INDEX IF NOT EXISTS booking_rooms_room_idx ON booking_rooms (physical_room_id);

INSERT INTO booking_rooms (booking_id, room_type_id, stay, nightly_rate, room_total, is_active)
SELECT b.id, b.room_type_id, daterange(b.check_in, b.check_out, '[)'),
       b.price, b.room_total, (b.status IN ('confirmed', 'checked_in', 'checked_out'))
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM booking_rooms br WHERE br.booking_id = b.id);

-- ---------------------------------------------------------------------------
-- Booking status history.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_status_history (
  id bigserial PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_status_history_booking_idx
  ON booking_status_history (booking_id, created_at DESC);
