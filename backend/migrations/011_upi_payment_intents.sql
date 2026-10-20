-- 011_upi_payment_intents: native UPI intents and trusted provider callbacks.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS provider_transaction_id text;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (
  status IN (
    'awaiting_payment', 'reference_submitted', 'verified', 'rejected',
    'pending', 'success', 'failed', 'cancelled'
  )
);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check CHECK (
  payment_status IN (
    'awaiting_payment', 'reference_submitted', 'verified', 'rejected',
    'pay_at_hotel', 'refunded', 'pending', 'success', 'failed', 'cancelled'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_reference_key
  ON payments (provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_transaction_id_key
  ON payments (provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_native_upi_booking_key
  ON payments (booking_id)
  WHERE provider = 'native_upi';

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  provider_event_id text PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_idempotency_keys (
  idempotency_key uuid PRIMARY KEY,
  request_hash text NOT NULL,
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
