import test from "node:test";
import assert from "node:assert/strict";
import { advanceInvitationLift, INVITATION_LIFT_DURATION } from "./invitationTransition.js";

test("the flat invitation lifts immediately and hands over without a covered pause", () => {
  for (const fps of [30, 60, 120]) {
    const state = { elapsed: 0, lift: 0, reopening: false };
    let elapsed = 0, previous = 0;
    while (!state.complete && elapsed < 2) {
      assert.equal(advanceInvitationLift(state, 1 / fps), state);
      assert.ok(state.lift >= previous && state.lift <= 1);
      assert.ok(state.lift > 0);
      assert.equal(state.veil, undefined);
      previous = state.lift;
      elapsed += 1 / fps;
    }
    assert.ok(Math.abs(elapsed - INVITATION_LIFT_DURATION) <= 1 / fps + 1e-9);
    assert.equal(state.lift, 1);
  }
});

test("reversing lowers the whole card and a stalled frame cannot skip the lift", () => {
  const state = { elapsed: .5, lift: .5, reopening: false };
  advanceInvitationLift(state, 1 / 60);
  const beforeReverse = state.lift;
  advanceInvitationLift(state, 1 / 60, true);
  assert.ok(state.lift < beforeReverse && state.lift > 0);
  for (let i = 0; i < 100; i++) advanceInvitationLift(state, 1 / 60);
  assert.equal(state.cancelled, true);
  assert.equal(state.lift, 0);
  const stalled = { elapsed: 0, lift: 0, reopening: false };
  advanceInvitationLift(stalled, 20);
  assert.ok(stalled.elapsed <= .05);
  assert.equal(stalled.complete, false);
});
