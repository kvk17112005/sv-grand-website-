-- 010_admin_ops: small non-breaking additions needed by the admin / super-admin
-- consoles. The migration runner wraps this file in a transaction.

-- Live room grid & housekeeping board show the assigned housekeeper per room.
ALTER TABLE physical_rooms ADD COLUMN IF NOT EXISTS assigned_housekeeper text;

-- Guest requests can be raised for walk-ins / non-booking guests, so keep a
-- denormalised guest name alongside the optional booking reference, and scope
-- them to a hotel like every other hotel-owned table.
ALTER TABLE guest_requests ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE guest_requests ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS guest_requests_hotel_idx ON guest_requests (hotel_id, created_at DESC);

-- Super-admin hotel settings panel edits a marketing tagline and (optional)
-- GST number / wizard discount. GST stays 0 until legal sign-off.
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE hotel_settings ADD COLUMN IF NOT EXISTS gst_number text;
ALTER TABLE hotel_settings
  ADD COLUMN IF NOT EXISTS wizard_discount_percentage numeric(5,2) NOT NULL DEFAULT 0
    CHECK (wizard_discount_percentage >= 0 AND wizard_discount_percentage <= 100);
