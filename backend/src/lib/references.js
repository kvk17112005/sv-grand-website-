import { randomInt } from "node:crypto";

export function generateRequestReference() {
  return `REQ-${randomInt(1000, 10000)}`;
}

export function generateBookingId() {
  return `SVG-${randomInt(100000, 1000000)}`;
}
