-- 003_inventory: physical rooms and room status history.
-- The migration runner wraps this file in a transaction.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS physical_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  floor integer NOT NULL DEFAULT 1,
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  operational_status text NOT NULL DEFAULT 'available'
    CHECK (operational_status IN ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_service')),
  housekeeping_status text NOT NULL DEFAULT 'clean'
    CHECK (housekeeping_status IN ('dirty', 'cleaning', 'inspected', 'clean')),
  notes text,
  last_cleaned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, room_number)
);

CREATE INDEX IF NOT EXISTS physical_rooms_type_idx ON physical_rooms (room_type_id, is_active);
CREATE INDEX IF NOT EXISTS physical_rooms_status_idx ON physical_rooms (hotel_id, operational_status);

CREATE TABLE IF NOT EXISTS room_status_history (
  id bigserial PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES physical_rooms(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS room_status_history_room_idx ON room_status_history (room_id, created_at DESC);

-- Seed the 12 physical rooms of SV Grand.
INSERT INTO physical_rooms (id, hotel_id, room_number, floor, room_type_id) VALUES
  ('c0000000-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', '101', 1, 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', '102', 1, 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000103', '11111111-1111-1111-1111-111111111111', '103', 1, 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000104', '11111111-1111-1111-1111-111111111111', '104', 1, 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000105', '11111111-1111-1111-1111-111111111111', '105', 1, 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000201', '11111111-1111-1111-1111-111111111111', '201', 2, 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000202', '11111111-1111-1111-1111-111111111111', '202', 2, 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000203', '11111111-1111-1111-1111-111111111111', '203', 2, 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000204', '11111111-1111-1111-1111-111111111111', '204', 2, 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000205', '11111111-1111-1111-1111-111111111111', '205', 2, 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000206', '11111111-1111-1111-1111-111111111111', '206', 2, 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000301', '11111111-1111-1111-1111-111111111111', '301', 3, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;
