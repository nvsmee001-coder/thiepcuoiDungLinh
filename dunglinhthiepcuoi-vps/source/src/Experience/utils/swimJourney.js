import { smoothFlight } from "./flightLanding.js";

export const JUMP_START = .802;
export const JUMP_END = .852;
export const DIVE_START = JUMP_END;
export const DIVE_HIDDEN = .882;

export const SWIM_START = JUMP_START;
export const SWIM_FULL = DIVE_START;

export function getSwimStage(progress, transitioning) {
  if (transitioning) return null;
  if (progress < JUMP_START) return null;
  if (progress < DIVE_START) return "swim";
  return progress < DIVE_HIDDEN ? "dive" : "submerged";
}

// Every pose comes directly from the route position, so seeking and reversing
// need no stored animation state. Time only supplies the swimming bob.
export function sampleSwimJourney(progress, transitioning, time = 0, out = {}) {
  out.swimWeight = 0;
  out.bank = 0;
  out.yOffset = 0;
  out.rotZ = 0;
  out.hidden = false;
  out.board = 0;

  // Flight owns one seated plane/rider rig from its first frame.
  if (transitioning) return out;

  if (progress >= DIVE_HIDDEN) {
    out.swimWeight = 1;
    out.bank = -Math.PI;
    out.yOffset = -8;
    out.hidden = true;
    return out;
  }

  if (progress >= DIVE_START) {
    const t = (progress - DIVE_START) / (DIVE_HIDDEN - DIVE_START);
    const eased = smoothFlight(t);
    out.swimWeight = 1;
    out.bank = -Math.PI / 2 * (1 + smoothFlight(t * 1.5));
    out.yOffset = -8 * eased;
    out.rotZ = -0.15 * (1 - eased);
    return out;
  }

  if (progress >= JUMP_START) {
    const t = (progress - JUMP_START) / (DIVE_START - JUMP_START);
    // Cú nhảy Parabol bay qua đầu cô dâu chú rể:
    out.yOffset = Math.sin(Math.PI * t) * 4.3;
    out.bank = -Math.PI / 2 * smoothFlight(Math.max(0, (t - 0.5) / 0.5));
    out.rotZ = Math.sin(Math.PI * 2 * t) * -0.28;
    out.swimWeight = smoothFlight(Math.max(0, (t - 0.4) / 0.6));
    return out;
  }

  return out;
}
