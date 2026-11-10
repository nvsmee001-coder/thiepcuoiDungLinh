import { animationDelta } from "./frameTiming.js";

export const BIKE_BOARD_START = .045;
export const BIKE_BOARD_END = .065;
export const TAKEOFF_END = .42;
export const TAKEOFF_CLEARANCE = .8;
export const TAKEOFF_DEPTH = 1.6;
export const TAKEOFF_DURATION = 1.8;
export const LANDING_REVEAL_START = .72;
export const FLIGHT_STOP = .84;
export const TOUCHDOWN = .93;
export const JUMP_END = .99;
export const constrainJourneyTarget = (target, flying, loop = 1, autoScroll = false) => flying ? Math.min(FLIGHT_STOP, target) : loop > 1 || autoScroll ? target : Math.max(0, target);
export const getFlightStage = (progress) => progress < TAKEOFF_END ? "takeoff" : progress < FLIGHT_STOP ? "plane" : progress < TOUCHDOWN ? "landing" : progress < JUMP_END ? "jump" : "bike";

// Finish the gentle rise without requiring another gesture. Reversing hands
// control back to the visitor until this flight ends.
export function stepAutomaticTakeoff(state, progress, target, delta) {
  if (target < progress - .002) state.cancelled = true;
  if (state.cancelled || progress >= TAKEOFF_END) return null;
  return Math.min(TAKEOFF_END, progress + animationDelta(delta) * TAKEOFF_END / TAKEOFF_DURATION);
}

// The marker starts a short automatic sequence; the visitor can still reverse.
export function stepAutomaticLanding(state, progress, target, delta) {
  if (target < progress - .002) state.active = false;
  else if (progress >= FLIGHT_STOP - .005) state.active = true;
  return state.active ? progress + animationDelta(delta) * .09 : null;
}
export const flightDestinationX = (anchorX, sceneryX, nextLoop, shift) => anchorX + nextLoop * shift - sceneryX;
const WALK_DISTANCE = (16.89 * BIKE_BOARD_END / .3) * 1.25;
export const getBikeTravel = (progress) => Math.max(BIKE_BOARD_END, Math.min(.3, progress)) / .3;
// The raised card leaves the notebook backdrop in place while anchors for the
// next bicycle are prepared, without sweeping another wall across mid-flight.
export const sceneryLoopIndex = (loop, transitioning) => loop - 1 + (transitioning ? 1 : 0);
export const smoothFlight = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

// Foot contact in the bicycle's local space: walk on the stage, then step
// onto the waiting seat. The exact endpoint makes mounting reversible.
export function sampleIntroWalk(progress, seat, output) {
  const t = Math.max(0, Math.min(1, progress / BIKE_BOARD_END));
  const boarding = smoothFlight((progress - BIKE_BOARD_START) / (BIKE_BOARD_END - BIKE_BOARD_START));
  output.x = seat.x - WALK_DISTANCE * (1 - smoothFlight(t));
  output.y = .45 + (seat.y - .45) * boarding + .1 * Math.sin(Math.PI * boarding)
    + .025 * Math.sin(Math.PI * 8 * t) ** 2 * (1 - boarding);
  output.z = seat.z;
  output.rock = .035 * Math.sin(Math.PI * 8 * t) * (1 - boarding);
  return output;
}

export function sampleLoopFlight(progress, start, end, output) {
  const t = Math.max(0, Math.min(1, progress));
  const eased = smoothFlight(t);
  output.x = start.x + (end.x - start.x) * t;
  output.y = start.y + (end.y - start.y) * eased + .2 * Math.sin(Math.PI * t);
  output.z = start.z + (end.z - start.z) * eased;
  return output;
}

export function samplePlaneTakeoff(progress, start, end, output) {
  sampleLoopFlight(progress / FLIGHT_STOP, start, end, output);
  // Start at the lower screen edge with upward velocity, instead of spending
  // the first second travelling invisibly below the viewport.
  const t = Math.max(0, Math.min(1, progress / TAKEOFF_END));
  const climb = 1 - (1 - t) ** 3;
  output.takeoffOffset = -TAKEOFF_DEPTH * (1 - climb);
  output.frameOffsetX = -TAKEOFF_CLEARANCE * (1 - climb);
  output.y += output.takeoffOffset;
  output.bank = .075 * Math.sin(Math.PI * climb);
  return output;
}
export function sampleTouchdown(progress, start, end, output) {
  const t = Math.max(0, Math.min(1, (progress - FLIGHT_STOP) / (TOUCHDOWN - FLIGHT_STOP)));
  const eased = smoothFlight(t);
  output.x = start.x + (end.x - start.x) * eased;
  output.y = start.y + (end.y - start.y) * eased;
  output.z = start.z + (end.z - start.z) * eased;
  output.bank = -.1 * Math.sin(Math.PI * t);
  output.gear = eased;
  return output;
}

export function sampleBikeJump(progress, start, end, output) {
  const t = Math.max(0, Math.min(1, (progress - TOUCHDOWN) / (JUMP_END - TOUCHDOWN)));
  const eased = smoothFlight(t);
  output.x = start.x + (end.x - start.x) * eased;
  output.y = start.y + (end.y - start.y) * eased + .8 * Math.sin(Math.PI * t) ** 2;
  output.z = start.z + (end.z - start.z) * eased;
  output.bank = .06 * Math.sin(Math.PI * 2 * t);
  return output;
}
