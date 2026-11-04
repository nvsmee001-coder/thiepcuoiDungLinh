// Expand the four contiguous destinations while preserving the final invitations.
export const CITY_SCALE = 1.25;
export const CITY_START = -24.1;
export const CITY_END = 22;
export const CITY_REGIONS = [
  { id: "shanghai", start: CITY_START, end: -3.5 },
  { id: "halong", start: -3.5, end: 7.65 },
  { id: "hanoi", start: 7.65, end: 14.85 },
  { id: "bacninh", start: 14.85, end: CITY_END },
];

export function expandWorldX(x) {
  if (x <= CITY_START) return x;
  return x + (Math.min(x, CITY_END) - CITY_START) * (CITY_SCALE - 1);
}

// A rigid vehicle follows the expanded route without stretching its seat or deck.
export function expandedVehicleOffset(anchorX, offsetX) {
  return expandWorldX(anchorX + offsetX) - anchorX;
}

export function cityTravelSpeed(worldX) {
  return worldX >= CITY_START && worldX <= expandWorldX(CITY_END) ? 1 / CITY_SCALE : 1;
}
