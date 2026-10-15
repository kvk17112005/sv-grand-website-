-- 005_availability: enforce no overlapping active physical-room assignments.
-- Runner wraps this in a transaction.

-- Keep booking_rooms.is_active in sync with the booking's status whenever the
-- booking status changes. Only confirmed/checked_in assignments block a room.
CREATE OR REPLACE FUNCTION sync_booking_rooms_active()
RETURNS trigger AS $$
BEGIN
  UPDATE booking_rooms
     SET is_active = (NEW.status IN ('confirmed', 'checked_in'))
   WHERE booking_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_sync_rooms_active ON bookings;
CREATE TRIGGER trg_bookings_sync_rooms_active
AFTER UPDATE OF status ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_booking_rooms_active();

-- Prevent two active bookings from occupying the same physical room for
-- overlapping date ranges. Requires btree_gist (enabled in 003).
ALTER TABLE booking_rooms DROP CONSTRAINT IF EXISTS booking_rooms_no_overlap;
ALTER TABLE booking_rooms ADD CONSTRAINT booking_rooms_no_overlap
  EXCLUDE USING gist (
    physical_room_id WITH =,
    stay WITH &&
  )
  WHERE (is_active AND physical_room_id IS NOT NULL);

-- Fast availability scan for active allotments.
CREATE INDEX IF NOT EXISTS booking_rooms_active_type_stay_idx
  ON booking_rooms USING gist (room_type_id, stay)
  WHERE (is_active);
