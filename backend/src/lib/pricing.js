function round(value) {
  return Math.round(Number(value) || 0);
}

export function computeNights(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  const nights = (end.getTime() - start.getTime()) / 86400000;
  return Number.isInteger(nights) ? nights : NaN;
}

/**
 * Pure, server-authoritative stay pricing.
 *
 * @param {object} input
 * @param {number} input.room24Rate          published 24-hour rate for the room type
 * @param {12|24}  input.stayDuration        stay length in hours
 * @param {number} input.nights              number of nights (>=1; used only for 24h)
 * @param {number} input.children13Plus      count of guests 13+ beyond policy
 * @param {number} input.extraGuestCharge    per-night charge for a 13+ extra guest
 * @param {Array}  input.addOns              [{ amount }] pre-priced add-on line totals
 * @param {object|null} input.coupon         { discountType, discountValue, maxDiscount, minBookingAmount }
 * @param {number} input.taxPercentage       tax percent (0 for now)
 * @returns {object} itemized breakdown
 */
export function calculateStayPricing(input) {
  const {
    room24Rate,
    stayDuration = 24,
    nights = 1,
    children13Plus = 0,
    extraGuestCharge = 0,
    addOns = [],
    coupon = null,
    taxPercentage = 0,
  } = input;

  const is12Hour = stayDuration === 12;
  const durationDiscountAmount = is12Hour ? round(room24Rate * 0.3) : 0;
  const effectiveRate = is12Hour ? room24Rate - durationDiscountAmount : room24Rate;
  const multiplier = is12Hour ? 1 : Math.max(1, nights);
  const roomTotal = effectiveRate * multiplier;

  const extraGuestTotal = Math.max(0, children13Plus) * extraGuestCharge * multiplier;
  const addOnsTotal = addOns.reduce((sum, item) => sum + round(item.amount), 0);

  const subtotal = roomTotal + extraGuestTotal + addOnsTotal;

  let discountAmount = 0;
  let couponEligible = false;
  if (coupon) {
    const meetsMinimum = roomTotal >= (coupon.minBookingAmount ?? 0);
    if (meetsMinimum) {
      couponEligible = true;
      if (coupon.discountType === "percentage") {
        discountAmount = round((roomTotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount != null) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
      } else {
        discountAmount = round(coupon.discountValue);
      }
      discountAmount = Math.min(discountAmount, roomTotal);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = round((taxableAmount * taxPercentage) / 100);
  const grandTotal = taxableAmount + taxAmount;

  return {
    stayDuration,
    nights: multiplier,
    twentyFourHourRate: room24Rate,
    effectiveRate,
    durationDiscountAmount,
    roomTotal,
    extraGuestTotal,
    addOnsTotal,
    subtotal,
    couponEligible,
    discountAmount,
    couponCode: coupon?.code ?? null,
    taxPercentage,
    taxAmount,
    grandTotal,
  };
}
