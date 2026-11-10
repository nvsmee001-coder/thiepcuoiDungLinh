import test from "node:test";
import assert from "node:assert/strict";
import { BIKE_BOARD_END, FLIGHT_STOP, TOUCHDOWN, JUMP_END, getBikeTravel, sampleIntroWalk, sampleLoopFlight, sampleTouchdown, sampleBikeJump, stepAutomaticLanding, getFlightStage, sceneryLoopIndex, flightDestinationX, constrainJourneyTarget } from "./flightLanding.js";
import { TAKEOFF_END, TAKEOFF_CLEARANCE, TAKEOFF_DEPTH, TAKEOFF_DURATION, samplePlaneTakeoff, stepAutomaticTakeoff } from "./flightLanding.js";

test("takeoff rises from below after the final card and joins the exact landing path", () => {
  const start = { x: 45.425, y: 5.308, z: -1.47 };
  const cruise = { x: 48.485, y: 3.02, z: -1.28 };
  const first = samplePlaneTakeoff(0, start, cruise, {});
  assert.equal(first.takeoffOffset, -TAKEOFF_DEPTH);
  assert.equal(first.frameOffsetX, -TAKEOFF_CLEARANCE);
  assert.equal(first.x, start.x);
  let previousOffset = first.takeoffOffset;
  for (let i = 1; i <= 100; i++) {
    const progress = TAKEOFF_END * i / 100;
    const pose = samplePlaneTakeoff(progress, start, cruise, {});
    // Framing follows the unlowered surface, so this is visible screen ascent.
    assert.ok(pose.takeoffOffset > previousOffset);
    previousOffset = pose.takeoffOffset;
  }
  const arrived = samplePlaneTakeoff(FLIGHT_STOP, start, cruise, {});
  for (const axis of ["x", "y", "z"]) assert.ok(Math.abs(arrived[axis] - cruise[axis]) < 1e-12);
  assert.ok(Math.abs(arrived.takeoffOffset) < 1e-12);
  assert.ok(Math.abs(arrived.bank) < 1e-12);
  assert.equal(getFlightStage(0), "takeoff");
  assert.equal(getFlightStage(TAKEOFF_END), "plane");
});

test("automatic ascent starts immediately, finishes promptly and can be reversed at 30, 60 and 120 Hz", () => {
  for (const fps of [30, 60, 120]) {
    let progress = 0, elapsed = 0;
    const state = { cancelled: false };
    while (progress < TAKEOFF_END && elapsed < 4) {
      progress = stepAutomaticTakeoff(state, progress, progress, 1 / fps);
      elapsed += 1 / fps;
    }
    assert.equal(progress, TAKEOFF_END);
    assert.ok(Math.abs(elapsed - TAKEOFF_DURATION) <= 1 / fps + 1e-9);
    assert.equal(stepAutomaticTakeoff(state, progress, progress, 1 / fps), null);
    assert.equal(stepAutomaticTakeoff(state, .25, .2, 1 / fps), null);
    assert.equal(stepAutomaticTakeoff(state, .2, .3, 1 / fps), null);
  }
});

test("the aircraft is already at the frame edge when the card closes and rises on its first frame", () => {
  const start = { x: 45.425, y: 5.308, z: -1.47 };
  const cruise = { x: 48.485, y: 3.02, z: -1.28 };
  const first = samplePlaneTakeoff(0, start, cruise, {});
  assert.ok(first.takeoffOffset >= -1.6);
  assert.ok(Math.abs(first.frameOffsetX) <= .8);
  const next = stepAutomaticTakeoff({ cancelled: false }, 0, 0, 1 / 60);
  const moving = samplePlaneTakeoff(next, start, cruise, {});
  assert.ok(moving.takeoffOffset - first.takeoffOffset > .04);
});

test("opening walks to a waiting bicycle and mounts its exact seat", () => {
  const seat = { x: -20.65, y: 1.08, z: -1.23 }, pose = {};
  assert.equal(sampleIntroWalk(0, seat, pose), pose);
  assert.ok(pose.x < seat.x - 4);
  assert.equal(pose.y, .45);
  assert.equal(getBikeTravel(0), getBikeTravel(BIKE_BOARD_END));
  let previousX = pose.x;
  for (let i = 1; i <= 100; i++) {
    sampleIntroWalk(BIKE_BOARD_END * i / 100, seat, pose);
    assert.ok(pose.x >= previousX);
    previousX = pose.x;
  }
  assert.equal(pose.x, seat.x);
  assert.equal(pose.y, seat.y);
  assert.equal(pose.z, seat.z);
  assert.ok(Math.abs(pose.rock) < 1e-12);
  assert.equal(getBikeTravel(.3), 1);
});

test("reaching the marker completes landing and boarding without more visitor input at 30, 60 and 120 Hz", () => {
  for (const fps of [30, 60, 120]) {
    const state = { active: false }, stages = new Set();
    let progress = FLIGHT_STOP, target = progress, elapsed = 0;
    while (progress < 1 && elapsed < 3) {
      stages.add(getFlightStage(progress));
      progress = stepAutomaticLanding(state, progress, target, 1 / fps);
      target = progress;
      elapsed += 1 / fps;
    }
    assert.ok(progress >= 1);
    assert.ok(Math.abs(elapsed - (1 - FLIGHT_STOP) / .09) <= 1 / fps + 1e-9);
    assert.deepEqual([...stages], ["landing", "jump", "bike"]);
  }
});

test("manual flight navigation reaches the trigger and reversing cancels the automatic sequence", () => {
  assert.equal(constrainJourneyTarget(-.2, false), 0);
  assert.equal(constrainJourneyTarget(1.01, false), 1.01);
  assert.equal(constrainJourneyTarget(4, true), FLIGHT_STOP);
  assert.equal(constrainJourneyTarget(.7, true), .7);
  assert.equal(constrainJourneyTarget(-.01, true), -.01);
  assert.equal(constrainJourneyTarget(-.01, false, 2), -.01);
  const state = { active: false };
  assert.equal(stepAutomaticLanding(state, .8, .84, 1 / 60), null);
  assert.ok(stepAutomaticLanding(state, .84, .84, 1 / 60) > .84);
  assert.equal(stepAutomaticLanding(state, .9, .8, 1 / 60), null);
  assert.equal(state.active, false);
  assert.ok(stepAutomaticLanding(state, .84, .84, 10) <= .8445 + 1e-12);
});

test("touchdown lowers the plane to the stage before the rider arcs onto the bicycle's exact seat", () => {
  const cruise = { x: 54, y: 3, z: -1.28 };
  const landed = { x: 58, y: 1.28, z: -1.28 }, seat = { x: 60.8, y: 1.23, z: -1.28 };
  let previousY = cruise.y;
  for (let i = 0; i <= 60; i++) {
    const pose = sampleTouchdown(FLIGHT_STOP + (TOUCHDOWN - FLIGHT_STOP) * i / 60, cruise, landed, {});
    assert.ok(pose.y <= previousY + 1e-12);
    previousY = pose.y;
  }
  const touchdown = sampleTouchdown(TOUCHDOWN, cruise, landed, {});
  const late = sampleTouchdown(JUMP_END, cruise, landed, {});
  for (const axis of ["x", "y", "z"]) {
    assert.equal(touchdown[axis], landed[axis]);
    assert.equal(late[axis], landed[axis]);
    assert.equal(sampleBikeJump(TOUCHDOWN, landed, seat, {})[axis], landed[axis]);
    assert.equal(sampleBikeJump(JUMP_END, landed, seat, {})[axis], seat[axis]);
  }
  assert.equal(touchdown.gear, 1);
  assert.ok(Math.abs(touchdown.bank) < 1e-12);
  assert.ok(sampleBikeJump((TOUCHDOWN + JUMP_END) / 2, landed, seat, {}).y > landed.y + .7);
});

test("loop flight joins the airborne rider and next landing without a position jump in either direction", () => {
  const start = { x: 50.625, y: 5.3, z: -1.47 };
  const end = { x: 57.25, y: 3.1, z: -1.28 };
  const result = {};
  assert.deepEqual(sampleLoopFlight(0, start, end, result), start);
  const arrived = { ...sampleLoopFlight(1, start, end, result) };
  for (const axis of ["x", "y", "z"]) assert.ok(Math.abs(arrived[axis] - end[axis]) < 1e-12);
  for (const progress of [0, .1, .5, .9, 1]) {
    const forward = { ...sampleLoopFlight(progress, start, end, result) };
    const reverse = sampleLoopFlight(1 - progress, end, start, result);
    for (const axis of ["x", "y", "z"]) assert.ok(Math.abs(forward[axis] - reverse[axis]) < 1e-12);
  }
});

test("the next wall waits until the cards close, then stays fixed throughout flight", () => {
  for (const loop of [0, 1, 2, 3]) {
    assert.equal(sceneryLoopIndex(loop, false, .99), loop - 1);
    assert.equal(sceneryLoopIndex(loop, true, 0), loop);
    assert.equal(sceneryLoopIndex(loop, true, .59), loop);
    assert.equal(sceneryLoopIndex(loop, true, 1), sceneryLoopIndex(loop + 1, false, 0));
    assert.equal(sceneryLoopIndex(loop - 1, true, 1), sceneryLoopIndex(loop, false, 0));
  }
});

test("scenery swapping cannot move the flight destination backward or teleport it", () => {
  const shift = 70.47267625, localAnchor = -19.7875;
  for (const nextLoop of [-1, 0, 1, 2]) {
    const previousOffset = (nextLoop - 1) * shift, nextOffset = nextLoop * shift;
    const before = flightDestinationX(localAnchor + previousOffset, previousOffset, nextLoop, shift);
    const after = flightDestinationX(localAnchor + nextOffset, nextOffset, nextLoop, shift);
    assert.ok(Math.abs(before - after) < 1e-10);
    assert.ok(Math.abs(after - (localAnchor + nextOffset)) < 1e-10);
  }
});
