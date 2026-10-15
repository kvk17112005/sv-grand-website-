-- 001_initial: base auth + booking tables. Applied via the migration runner,
-- which provides the surrounding transaction and schema_migrations tracking.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  email text NOT NULL UNIQUE,
  phone text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin', 'super_admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS user_sessions_expire_idx
  ON user_sessions (expire);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  room_type text NOT NULL,
  room_name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guest_email text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer NOT NULL CHECK (adults >= 1),
  children integer NOT NULL CHECK (children >= 0),
  children_13_plus integer NOT NULL DEFAULT 0 CHECK (children_13_plus >= 0),
  children_below_13 integer NOT NULL DEFAULT 0 CHECK (children_below_13 >= 0),
  total_guests integer NOT NULL CHECK (total_guests >= 1),
  nights integer NOT NULL CHECK (nights > 0),
  room_total integer NOT NULL CHECK (room_total >= 0),
  extra_guest_total integer NOT NULL CHECK (extra_guest_total >= 0),
  grand_total integer NOT NULL CHECK (grand_total >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS bookings_user_created_idx
  ON bookings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_check_in_idx
  ON bookings (check_in);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
