export const BOOKING_STATUSES = [
  "pending_payment",
  "payment_verification",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
];

const TRANSITIONS = {
  pending_payment: ["payment_verification", "confirmed", "cancelled"],
  payment_verification: ["confirmed", "pending_payment", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

export function canTransition(from, to) {
  if (from === to) return true;
  return (TRANSITIONS[from] || []).includes(to);
}

export function getAllowedTransitions(from) {
  return TRANSITIONS[from] || [];
}

const ROOM_BLOCKING = new Set(["confirmed", "checked_in"]);
export function blocksInventory(status) {
  return ROOM_BLOCKING.has(status);
}

const HOLDING = new Set(["pending_payment", "payment_verification"]);
export function isHolding(status) {
  return HOLDING.has(status);
}
