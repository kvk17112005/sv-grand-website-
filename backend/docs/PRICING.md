# Pricing & Money

All monetary amounts use `numeric(12,2)`. Currency: `INR`.

## Rate Logic
- 24-hour (full day) rate published per room type (from `room_type_rates.stay_duration=24`).
- 12-hour stay: 30% discount off 24h rate. `effectiveRate = room24Rate - round(room24Rate*0.3)`. Multiplier = 1 for 12h; multiplier = nights for 24h.
- `roomTotal = effectiveRate * multiplier`.
- Extra guests (age 13+): `extraGuestTotal = children13Plus * extraGuestCharge * multiplier`. `extraGuestCharge` from `hotel_settings` (default 500).
- Children ≤ 13 free.
- Add-ons: pre-priced line amounts; per-night add-ons multiply by nights.

## Coupon Logic
- `discountType`: percentage | flat
- Percentage: `discountAmount = round(roomTotal * discountValue / 100)` capped at `maxDiscount` (if set)
- Flat: `discountAmount = discountValue`
- Eligible only if `roomTotal >= minBookingAmount`
- `discountAmount <= roomTotal`

## Totals
- `subtotal = roomTotal + extraGuestTotal + addOnsTotal`
- `taxableAmount = max(0, subtotal - discountAmount)`
- `taxAmount = round(taxableAmount * taxPercentage / 100)` (currently 0)
- `grandTotal = taxableAmount + taxAmount`

## Frontend parity
Server-authoritative computation. The 12h/24h logic matches the existing server code; the new pricing module formalizes it.

## References
- `src/lib/pricing.js`
- `src/services/bookings.js` (applies pricing)
- `migrations/002_foundation.sql` (rates)
- `migrations/006_promotions.sql` (offers/add-ons)
