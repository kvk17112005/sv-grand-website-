import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateStayPricing, computeNights } from "../src/lib/pricing.js";
import { canTransition, blocksInventory } from "../src/lib/bookingState.js";

test("computeNights counts whole nights", () => {
  assert.equal(computeNights("2026-11-01", "2026-11-03"), 2);
  assert.equal(computeNights("2026-11-01", "2026-11-02"), 1);
  assert.equal(computeNights("2026-11-03", "2026-11-01"), -2);
  assert.ok(Number.isNaN(computeNights("not-a-date", "2026-11-01")));
});

test("24h pricing multiplies the nightly rate", () => {
  const pricing = calculateStayPricing({ room24Rate: 1500, nights: 3 });
  assert.equal(pricing.roomTotal, 4500);
  assert.equal(pricing.grandTotal, 4500);
  assert.equal(pricing.taxAmount, 0);
});

test("12h pricing applies a 30% duration discount", () => {
  const pricing = calculateStayPricing({ room24Rate: 1500, stayDuration: 12, nights: 1 });
  assert.equal(pricing.durationDiscountAmount, 450);
  assert.equal(pricing.effectiveRate, 1050);
  assert.equal(pricing.grandTotal, 1050);
});

test("extra guests aged 13+ are charged per night", () => {
  const pricing = calculateStayPricing({
    room24Rate: 1500,
    nights: 2,
    children13Plus: 2,
    extraGuestCharge: 500,
  });
  assert.equal(pricing.extraGuestTotal, 2000);
  assert.equal(pricing.grandTotal, 5000);
});

test("percentage coupons are capped at maxDiscount", () => {
  const pricing = calculateStayPricing({
    room24Rate: 1500,
    nights: 2,
    coupon: { code: "WELCOME50", discountType: "percentage", discountValue: 50, maxDiscount: 1500, minBookingAmount: 0 },
  });
  assert.equal(pricing.discountAmount, 1500);
  assert.equal(pricing.grandTotal, 1500);
});

test("coupons below the minimum booking amount are ignored", () => {
  const pricing = calculateStayPricing({
    room24Rate: 1500,
    nights: 1,
    coupon: { code: "STAYLONG", discountType: "flat", discountValue: 800, minBookingAmount: 3200 },
  });
  assert.equal(pricing.couponEligible, false);
  assert.equal(pricing.discountAmount, 0);
});

test("tax is applied to the discounted total", () => {
  const pricing = calculateStayPricing({ room24Rate: 1000, nights: 1, taxPercentage: 12 });
  assert.equal(pricing.taxAmount, 120);
  assert.equal(pricing.grandTotal, 1120);
});

test("booking state machine blocks illegal jumps", () => {
  assert.equal(canTransition("pending_payment", "confirmed"), true);
  assert.equal(canTransition("pending_payment", "checked_in"), false);
  assert.equal(canTransition("checked_out", "confirmed"), false);
  assert.equal(blocksInventory("confirmed"), true);
  assert.equal(blocksInventory("pending_payment"), false);
});
