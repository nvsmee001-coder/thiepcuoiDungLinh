import { smoothFlight } from "./flightLanding.js";

export const SWIM_START = .85;
export const SWIM_FULL = .860;
export const DIVE_START = SWIM_FULL;
export const DIVE_HIDDEN = .890;

export function getSwimStage(progress, transitioning) {
  if (transitioning) return null;
  if (progress < SWIM_START) return null;
  if (progress < DIVE_START) return "swim";
  return progress < DIVE_HIDDEN ? "dive" : "submerged";
}

// Every pose comes directly from the route position, so seeking and reversing
// need no stored animation state. Time only supplies the swimming bob.
export function sampleSwimJourney(progress, transitioning, time = 0, out = {}) {
  out.swimWeight = 0;
  out.bank = 0;
  out.yOffset = 0;
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
    // Dive as soon as the swimmer turns: no upward leap or extra swim lap.
    out.swimWeight = 1;
    out.bank = -Math.PI / 2 * (1 + smoothFlight(t * 2.2));
    out.yOffset = -8 * smoothFlight(t);
    return out;
  }

  if (progress > SWIM_START) {
    const weight = smoothFlight((progress - SWIM_START) / (SWIM_FULL - SWIM_START));
    out.swimWeight = weight;
    out.bank = -Math.PI / 2 * weight;
    out.yOffset = .06 * Math.sin(time * 3) * weight * (1 - weight);
  }
  return out;
}
