-- 006_promotions: offers/coupons, redemptions, add-on services and selections.

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value >= 0),
  max_discount numeric(12,2),
  min_booking_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_booking_amount >= 0),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date,
  max_redemptions integer CHECK (max_redemptions IS NULL OR max_redemptions >= 0),
  per_customer_limit integer NOT NULL DEFAULT 1 CHECK (per_customer_limit >= 0),
  active boolean NOT NULL DEFAULT true,
  badge text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, code)
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_email text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, booking_id)
);

CREATE TABLE IF NOT EXISTS add_on_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  per_night boolean NOT NULL DEFAULT false,
  icon text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, code)
);

CREATE TABLE IF NOT EXISTS booking_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  add_on_service_id uuid NOT NULL REFERENCES add_on_services(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  per_night boolean NOT NULL DEFAULT false,
  amount numeric(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS booking_add_ons_booking_idx ON booking_add_ons (booking_id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES offers(id) ON DELETE SET NULL;

-- Seed offers (from the original front-end fixtures).
INSERT INTO offers (hotel_id, code, title, description, discount_type, discount_value, max_discount, min_booking_amount, valid_to, per_customer_limit, active, badge)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'WELCOME50', 'Welcome 50% Flat Discount',
   'Get flat 50% discount on your initial booking at SV Grand Luxury Rooms.',
   'percentage', 50, 1500, 1499, '2026-12-31', 1, true, 'Trending'),
  ('11111111-1111-1111-1111-111111111111', 'STAYLONG', 'Long Stay Special: Rs 800 Off',
   'Flat Rs 800 off when staying 2 nights or more.',
   'flat', 800, NULL, 3200, '2026-10-31', 1, true, 'Weekend Saver'),
  ('11111111-1111-1111-1111-111111111111', 'REGALVIP', 'Executive & Suite Exclusive Rs 1200 Off',
   'Instant Rs 1200 discount on premium categories.',
   'flat', 1200, NULL, 4000, '2026-12-31', 1, true, 'Luxury Deal')
ON CONFLICT (hotel_id, code) DO NOTHING;

-- Seed add-on services.
INSERT INTO add_on_services (hotel_id, code, name, description, price, per_night, icon)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'breakfast', 'Buffet Breakfast at The Regal Bistro',
   'Unlimited hot continental & Indian breakfast spread with freshly brewed coffee.', 299, true, 'Coffee'),
  ('11111111-1111-1111-1111-111111111111', 'airport_transfer', 'Airport Transfer (Pick up or Drop)',
   'Private air-conditioned sedan transfer.', 899, false, 'Car'),
  ('11111111-1111-1111-1111-111111111111', 'late_checkout', 'Guaranteed Late Check-out (till 3:00 PM)',
   'Extend your relaxation without rush. Subject to hotel availability.', 499, false, 'Clock'),
  ('11111111-1111-1111-1111-111111111111', 'extra_bed', 'Extra Rollaway Bed with Linen',
   'Plush rollaway mattress setup with premium duvet and double pillows.', 600, true, 'Bed')
ON CONFLICT (hotel_id, code) DO NOTHING;
