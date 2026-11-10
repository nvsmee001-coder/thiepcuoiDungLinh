import { animationDelta } from "./frameTiming.js";
import { smoothFlight } from "./flightLanding.js";

export const INVITATION_CLOSE_TRIGGER = .985;
export const INVITATION_LIFT_DURATION = .65;

// One reversible clock pulls the flat card up; there is no background veil.
export function advanceInvitationLift(state, delta, reverse = false) {
  if (reverse) state.reopening = true;
  state.elapsed = Math.max(0, Math.min(INVITATION_LIFT_DURATION,
    state.elapsed + animationDelta(delta) * (state.reopening ? -1 : 1)));
  state.lift = smoothFlight(state.elapsed / INVITATION_LIFT_DURATION);
  state.complete = !state.reopening && state.elapsed >= INVITATION_LIFT_DURATION;
  state.cancelled = state.reopening && state.elapsed <= 0;
  return state;
}
