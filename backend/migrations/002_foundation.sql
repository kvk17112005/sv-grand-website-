-- 002_foundation: hotel configuration, room types, rates, amenities.
-- The migration runner wraps this file in a transaction; do not add BEGIN/COMMIT.

-- ---------------------------------------------------------------------------
-- Users: account status + security audit fields (non-breaking additions).
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check
      CHECK (status IN ('active', 'disabled', 'locked'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Hotels
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  city text,
  state text,
  pincode text,
  country text NOT NULL DEFAULT 'India',
  phone text,
  email text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  currency text NOT NULL DEFAULT 'INR',
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  check_in_time time NOT NULL DEFAULT '12:00',
  check_out_time time NOT NULL DEFAULT '11:00',
  tax_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_percentage >= 0),
  tax_inclusive boolean NOT NULL DEFAULT false,
  extra_guest_charge numeric(12,2) NOT NULL DEFAULT 500 CHECK (extra_guest_charge >= 0),
  child_free_age integer NOT NULL DEFAULT 12 CHECK (child_free_age >= 0),
  hold_expiry_minutes integer NOT NULL DEFAULT 60 CHECK (hold_expiry_minutes > 0),
  upi_id text,
  upi_payee_name text,
  qr_image_path text,
  policy_text text,
  policy_version text NOT NULL DEFAULT 'v1',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id)
);

-- ---------------------------------------------------------------------------
-- Amenities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Room types, effective-dated rates, images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  is_ac boolean NOT NULL DEFAULT true,
  bedroom_type text NOT NULL CHECK (bedroom_type IN ('single', 'double')),
  max_adults integer NOT NULL DEFAULT 2 CHECK (max_adults >= 1),
  max_children integer NOT NULL DEFAULT 0 CHECK (max_children >= 0),
  max_guests integer NOT NULL DEFAULT 2 CHECK (max_guests >= 1),
  size_sqft integer,
  bed_type text,
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0
    CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, code)
);

CREATE TABLE IF NOT EXISTS room_type_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  stay_duration integer NOT NULL CHECK (stay_duration IN (12, 24)),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS room_type_rates_lookup_idx
  ON room_type_rates (room_type_id, stay_duration, effective_from DESC);

CREATE TABLE IF NOT EXISTS room_type_amenities (
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS room_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS room_images_room_type_idx ON room_images (room_type_id, sort_order);

-- ---------------------------------------------------------------------------
-- Seed: SV Grand Luxury Rooms (single hotel).
-- ---------------------------------------------------------------------------
INSERT INTO hotels (id, code, name, address, city, state, pincode, country, phone, email, timezone, currency, latitude, longitude)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'SVGRAND-TPT',
  'SV Grand Luxury Rooms',
  'Railway Station Road, Near APSRTC Bus Stand',
  'Tadipatri',
  'Andhra Pradesh',
  '515411',
  'India',
  '+91 85582 22555',
  'stay@svgrandluxuryrooms.com',
  'Asia/Kolkata',
  'INR',
  14.912400,
  78.012800
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotel_settings (hotel_id, tax_percentage, extra_guest_charge, upi_id, upi_payee_name, qr_image_path, policy_text, policy_version)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  0,
  500,
  '3341101017051@cnrb',
  'Kummara Papamma',
  '/payment-qr.jpeg',
  '100% full refund if cancelled up to 24 hours prior to check-in. Aadhaar is not stored by this system. Tax (GST) applicability must be verified before production; currently 0%.',
  'v1'
)
ON CONFLICT (hotel_id) DO NOTHING;

INSERT INTO amenities (code, name, icon, sort_order) VALUES
  ('split_ac', 'Split Air Conditioning', 'Snowflake', 10),
  ('ceiling_fan', 'High-Speed Ceiling Fan', 'Fan', 11),
  ('wifi', 'High-Speed Wi-Fi', 'Wifi', 20),
  ('smart_tv', 'Smart LED TV', 'Tv', 30),
  ('power_backup', '24/7 Power Backup', 'Zap', 40),
  ('geyser', 'Geyser Hot Water', 'Droplet', 50),
  ('housekeeping', 'Daily Housekeeping', 'Sparkles', 60),
  ('toiletries', 'Sanitized Toiletries', 'ShowerHead', 70),
  ('mineral_water', 'Bottled Mineral Water', 'CupSoda', 80),
  ('mini_fridge', 'Mini Refrigerator', 'Refrigerator', 90),
  ('wardrobe', 'Workstation & Wardrobe', 'Shirt', 100),
  ('king_bed', 'King Bed / Twin Doubles', 'BedDouble', 110)
ON CONFLICT (code) DO NOTHING;

INSERT INTO room_types (id, hotel_id, code, name, tagline, description, is_ac, bedroom_type, max_adults, max_children, max_guests, size_sqft, bed_type, display_order)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'single_ac', 'AC Single Room',
   'Chilled split AC single bedroom for 1-2 guests with premium comfort',
   'Comfortable single bedroom with split air-conditioning, a queen bed, Wi-Fi, TV, hot water, and housekeeping.',
   true, 'single', 2, 1, 2, 210, '1 Queen Bed', 10),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'single_non_ac', 'Non-AC Single Room',
   'Well-ventilated economy single bedroom for 1-2 guests with ceiling fan',
   'Airy single bedroom with a ceiling fan, queen bed, TV, hot water, and power backup.',
   false, 'single', 2, 1, 2, 200, '1 Queen Bed', 20),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'double_ac', 'AC Double Room',
   'Spacious luxury double bedroom with split AC for families & couples (up to 4 guests)',
   'Spacious double bedroom with split air-conditioning, a king bed, TV, wardrobe, and attached bathroom with hot water.',
   true, 'double', 4, 2, 4, 340, '1 King Bed (or 2 Double Beds)', 30),
  ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'double_non_ac', 'Non-AC Double Room',
   'Expansive economy double bedroom for families & groups (up to 4 guests)',
   'Well-ventilated double bedroom with ceiling fans, double beds, TV, attached bathroom, hot water, and power backup.',
   false, 'double', 4, 2, 4, 320, '1 King Bed (or 2 Double Beds)', 40)
ON CONFLICT (id) DO NOTHING;

INSERT INTO room_type_rates (room_type_id, stay_duration, amount) VALUES
  ('a0000000-0000-0000-0000-000000000001', 24, 1500),
  ('a0000000-0000-0000-0000-000000000001', 12, 1050),
  ('a0000000-0000-0000-0000-000000000002', 24, 1000),
  ('a0000000-0000-0000-0000-000000000002', 12, 700),
  ('a0000000-0000-0000-0000-000000000003', 24, 1500),
  ('a0000000-0000-0000-0000-000000000003', 12, 1050),
  ('a0000000-0000-0000-0000-000000000004', 24, 1500),
  ('a0000000-0000-0000-0000-000000000004', 12, 1050);

INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id
FROM room_types rt
JOIN amenities a ON a.code = ANY (
  CASE rt.code
    WHEN 'single_ac' THEN ARRAY['split_ac','wifi','smart_tv','power_backup','geyser','housekeeping','toiletries','mineral_water']
    WHEN 'single_non_ac' THEN ARRAY['ceiling_fan','wifi','smart_tv','power_backup','geyser','housekeeping','toiletries']
    WHEN 'double_ac' THEN ARRAY['split_ac','king_bed','wifi','smart_tv','mini_fridge','power_backup','geyser','wardrobe']
    ELSE ARRAY['ceiling_fan','king_bed','wifi','smart_tv','power_backup','geyser','wardrobe','housekeeping']
  END
)
WHERE rt.code IN ('single_ac','single_non_ac','double_ac','double_non_ac')
ON CONFLICT DO NOTHING;

INSERT INTO room_images (room_type_id, url, alt_text, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', '/hotel/ac-room-1.jpg', 'AC Single Room', 1),
  ('a0000000-0000-0000-0000-000000000001', '/hotel/premium-ac-room.jpg', 'AC Single Room premium view', 2),
  ('a0000000-0000-0000-0000-000000000002', '/hotel/single-bed-room.jpg', 'Non-AC Single Room', 1),
  ('a0000000-0000-0000-0000-000000000002', '/hotel/non-ac-room-1.jpg', 'Non-AC Single Room view', 2),
  ('a0000000-0000-0000-0000-000000000003', '/hotel/double-bed-room.jpg', 'AC Double Room', 1),
  ('a0000000-0000-0000-0000-000000000003', '/hotel/ac-room-1.jpg', 'AC Double Room view', 2),
  ('a0000000-0000-0000-0000-000000000004', '/hotel/non-ac-room-2.jpg', 'Non-AC Double Room', 1),
  ('a0000000-0000-0000-0000-000000000004', '/hotel/non-ac-room-1.jpg', 'Non-AC Double Room view', 2);
