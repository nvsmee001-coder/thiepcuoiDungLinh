import test from "node:test";
import assert from "node:assert/strict";
import { BIKE_BOARD_END, FLIGHT_STOP, TOUCHDOWN, JUMP_END, getBikeTravel, sampleIntroWalk, sampleLoopFlight, sampleTouchdown, sampleBikeJump, stepAutomaticLanding, getFlightStage, sceneryLoopIndex, flightDestinationX, constrainJourneyTarget } from "./flightLanding.js";

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

test("the next wall cannot cover the venue cards, and scenery joins in both scroll directions", () => {
  for (const loop of [0, 1, 2, 3]) {
    assert.equal(sceneryLoopIndex(loop, false, .99), loop - 1);
    assert.equal(sceneryLoopIndex(loop, true, 0), loop - 1);
    assert.equal(sceneryLoopIndex(loop, true, .59), loop - 1);
    assert.equal(sceneryLoopIndex(loop, true, 1), sceneryLoopIndex(loop + 1, false, 0));
    assert.equal(sceneryLoopIndex(loop - 1, true, 1), sceneryLoopIndex(loop, false, 0));
  }
});

test("scenery swapping cannot move the flight destination backward or teleport it", () => {
  const shift = 76.47267625, localAnchor = -19.7875;
  for (const nextLoop of [-1, 0, 1, 2]) {
    const previousOffset = (nextLoop - 1) * shift, nextOffset = nextLoop * shift;
    const before = flightDestinationX(localAnchor + previousOffset, previousOffset, nextLoop, shift);
    const after = flightDestinationX(localAnchor + nextOffset, nextOffset, nextLoop, shift);
    assert.ok(Math.abs(before - after) < 1e-10);
    assert.ok(Math.abs(after - (localAnchor + nextOffset)) < 1e-10);
  }
});
