export const BOAT_DOCK_START = .46;
export const BOAT_DOCK_END = .49;
export const HANOI_BOARD_START = .48;
export const HANOI_BOARD_END = .515;
export const HANOI_RIDE_END = .60;
export const HANOI_DISMOUNT_END = .62;
// The rear wheel clears the dry bank at x=7.65, beside The Huc bridge.
export const HANOI_BIKE_START_X = 8.45;
export const HANOI_BIKE_END_X = 14.15;
export const HANOI_BIKE_LIFT = 1.82;

const clamp01 = value => Math.max(0, Math.min(1, value));
export const easeHanoi = value => {
  const t = clamp01(value);
  return t * t * t * (10 + t * (-15 + 6 * t));
};
export const hanoiBoardWeight = progress => easeHanoi(
  (progress - HANOI_BOARD_START) / (HANOI_BOARD_END - HANOI_BOARD_START),
);
export const hanoiDismountWeight = progress => easeHanoi(
  (progress - HANOI_RIDE_END) / (HANOI_DISMOUNT_END - HANOI_RIDE_END),
);
export const hanoiRideWeight = progress => easeHanoi(
  (progress - HANOI_BOARD_END) / (HANOI_RIDE_END - HANOI_BOARD_END),
);
export const hanoiBikeX = progress => HANOI_BIKE_START_X
  + (HANOI_BIKE_END_X - HANOI_BIKE_START_X) * hanoiRideWeight(progress);

export function getHanoiStage(progress, flying = false) {
  if (flying || !Number.isFinite(progress) || progress < HANOI_BOARD_START) return null;
  if (progress < HANOI_BOARD_END) return "hanoiBoard";
  if (progress < HANOI_RIDE_END) return "hanoiBike";
  return progress < HANOI_DISMOUNT_END ? "hanoiDismount" : null;
}

// Match the original boat speed on entry, then reach zero speed at the bank.
// All values depend on progress, so reversing retraces exactly the same route.
export function boatTravelAt(progress) {
  if (progress <= BOAT_DOCK_START) return clamp01((progress - .31) / .18);
  const t = clamp01((progress - BOAT_DOCK_START) / (BOAT_DOCK_END - BOAT_DOCK_START));
  const start = (BOAT_DOCK_START - .31) / .18;
  return start + (1 - start) * (t + t * t - t * t * t);
}
export const boatMotionWeight = progress => 1 - easeHanoi(
  (progress - BOAT_DOCK_START) / (BOAT_DOCK_END - BOAT_DOCK_START),
);

export function sampleHanoiTransfer(start, end, weight, arcHeight, out) {
  const t = clamp01(weight);
  const arc = arcHeight * Math.sin(Math.PI * t) ** 2;
  out.x = start.x + (end.x - start.x) * t;
  out.y = start.y + (end.y - start.y) * t + arc;
  out.z = start.z + (end.z - start.z) * t;
  return out;
}
