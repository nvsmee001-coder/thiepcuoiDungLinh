import test from "node:test";
import assert from "node:assert/strict";
import { isPhoneViewport, touchScrollDelta } from "./mobileCharacterLayout.js";

test("phone portrait and landscape are classified separately from desktop", () => {
  assert.equal(isPhoneViewport(390, 844, true), true);
  assert.equal(isPhoneViewport(844, 390, true), true);
  assert.equal(isPhoneViewport(1280, 720, false), false);
});

test("touch speed is based on swipe distance and direction, independent of event frequency", () => {
  const full = touchScrollDelta(700, 200, 844);
  assert.ok(full > 0);
  assert.equal(touchScrollDelta(200, 700, 844), -full);
  const segmented = touchScrollDelta(700, 550, 844) + touchScrollDelta(550, 350, 844) + touchScrollDelta(350, 200, 844);
  assert.ok(Math.abs(segmented - full) < 1e-10);
  assert.equal(touchScrollDelta(200, 200, 844), 0);
});
