-- 008_operations: staff, shifts, housekeeping, maintenance, guest requests.

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  job_title text NOT NULL,
  phone text,
  email text,
  shift text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  joined_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_hotel_idx ON staff (hotel_id, status);

CREATE TABLE IF NOT EXISTS staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_shifts_staff_idx ON staff_shifts (staff_id, shift_date);

CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES physical_rooms(id) ON DELETE CASCADE,
  task_type text NOT NULL DEFAULT 'cleaning'
    CHECK (task_type IN ('cleaning', 'turnover', 'deep_clean', 'inspection')),
  status text NOT NULL DEFAULT 'dirty'
    CHECK (status IN ('dirty', 'cleaning', 'inspected', 'clean')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS housekeeping_status_idx ON housekeeping_tasks (hotel_id, status);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id uuid REFERENCES physical_rooms(id) ON DELETE SET NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS maintenance_status_idx ON maintenance_tickets (hotel_id, status);

CREATE TABLE IF NOT EXISTS guest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  room_id uuid REFERENCES physical_rooms(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('room_cleaning', 'extra_towels', 'food_order', 'late_checkout', 'maintenance', 'other')),
  title text NOT NULL,
  notes text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_requests_booking_idx ON guest_requests (booking_id);
CREATE INDEX IF NOT EXISTS guest_requests_status_idx ON guest_requests (status);

CREATE TABLE IF NOT EXISTS guest_request_updates (
  id bigserial PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES guest_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
