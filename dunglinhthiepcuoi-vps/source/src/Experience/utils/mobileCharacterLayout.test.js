import test from "node:test";
import assert from "node:assert/strict";
import { isPhoneViewport, mobileCharacterLayout, touchScrollDelta } from "./mobileCharacterLayout.js";

test("the whole character, stick and tallest outfit stay within the left of phone viewports", () => {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932], [844, 390], [932, 430]]) {
    const rect = mobileCharacterLayout(width, height);
    assert.ok(rect.left >= 12 && rect.left + rect.width < width * .5);
    assert.ok(height - rect.bottom - rect.height > 0);
    assert.ok(rect.bottom >= 34);
  }
});

test("phone rotation retains the anchored mode while desktop retains the route", () => {
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
