import test from "node:test";
import assert from "node:assert/strict";
import {
  SWIM_START, SWIM_FULL, DIVE_START, DIVE_HIDDEN,
  getSwimStage, sampleSwimJourney,
} from "./swimJourney.js";

const close = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};
const identity = { swimWeight: 0, bank: 0, yOffset: 0, hidden: false, board: 0 };
const underwater = { swimWeight: 1, bank: -Math.PI, yOffset: -8, hidden: true, board: 0 };

test("swim stages end before the invitations and leave flight to its seated rig", () => {
  assert.equal(getSwimStage(SWIM_START - .001, false), null);
  assert.equal(getSwimStage(SWIM_START, false), "swim");
  assert.equal(getSwimStage(SWIM_FULL, false), "dive");
  assert.equal(getSwimStage(DIVE_START, false), "dive");
  assert.equal(getSwimStage(DIVE_HIDDEN, false), "submerged");
  assert.equal(getSwimStage(1, false), "submerged");
  for (const progress of [0, .2, .42, .64, .8, 1]) {
    assert.equal(getSwimStage(progress, true), null);
  }
});

test("the swimmer eases into a horizontal pose and joins the dive without a jump", () => {
  const out = { ...underwater };
  assert.equal(sampleSwimJourney(SWIM_START, false, 1, out), out);
  assert.deepEqual(out, identity);
  assert.deepEqual(sampleSwimJourney(0, false, 1, out), identity);
  const entry = sampleSwimJourney(SWIM_START + 1e-8, false, 1, {});
  close(entry.bank, 0);
  close(entry.swimWeight, 0);
  close(entry.yOffset, 0);
  const full = sampleSwimJourney(SWIM_FULL, false, 1, {});
  assert.equal(full.swimWeight, 1);
  assert.equal(full.bank, -Math.PI / 2);
  assert.ok(Math.abs(full.yOffset) <= .06);
  const beforeDive = sampleSwimJourney(DIVE_START - 1e-8, false, 1, {});
  const dive = sampleSwimJourney(DIVE_START, false, 1, {});
  close(beforeDive.yOffset, dive.yOffset);
  close(beforeDive.bank, dive.bank);
  close(beforeDive.swimWeight, dive.swimWeight);
  close(dive.yOffset, 0);
});

test("the full swimmer dives immediately downward and hides before the next panel", () => {
  assert.equal(DIVE_START, SWIM_FULL);
  assert.ok(DIVE_HIDDEN <= .9);
  let previousY = 0;
  for (let i = 0; i <= 100; i++) {
    const pose = sampleSwimJourney(DIVE_START + (DIVE_HIDDEN - DIVE_START) * i / 100, false, 0, {});
    assert.ok(pose.yOffset <= previousY);
    assert.ok(pose.yOffset <= 0);
    previousY = pose.yOffset;
  }
  const beforeHidden = sampleSwimJourney(DIVE_HIDDEN - 1e-8, false, 0, {});
  assert.equal(beforeHidden.hidden, false);
  close(beforeHidden.yOffset, -8);
  close(beforeHidden.bank, -Math.PI);
  for (const progress of [DIVE_HIDDEN, .95, 1, 2]) {
    assert.deepEqual(sampleSwimJourney(progress, false, 123, {}), underwater);
  }
});

test("flight never replays the separate swimmer below or beside the plane", () => {
  for (let i = 0; i <= 100; i++) {
    assert.deepEqual(sampleSwimJourney(i / 100, true, 2, { ...underwater }), identity);
  }
});

test("reused output samples stay finite and identical while seeking backwards at any frame rate", () => {
  const points = [-.1, 0, .42, .64, .8, SWIM_START,
    (SWIM_START + SWIM_FULL) / 2, SWIM_FULL, DIVE_START,
    (DIVE_START + DIVE_HIDDEN) / 2, DIVE_HIDDEN, 1];
  for (const transitioning of [false, true]) {
    const expected = points.map((progress) => ({ ...sampleSwimJourney(progress, transitioning, 1.25, {}) }));
    for (const fps of [30, 60, 120]) {
      const reused = {};
      for (let frame = 0; frame <= fps; frame++) {
        sampleSwimJourney(frame / fps, transitioning, frame / fps, reused);
      }
      for (let i = points.length - 1; i >= 0; i--) {
        assert.equal(sampleSwimJourney(points[i], transitioning, 1.25, reused), reused);
        assert.deepEqual(reused, expected[i]);
        for (const field of ["swimWeight", "bank", "yOffset", "board"]) {
          assert.ok(Number.isFinite(reused[field]));
        }
      }
    }
  }
});
