import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { animationDelta, frameAlpha, createQualityState, updateQuality } from "./frameTiming.js";
import { createRotationSampler } from "./cameraRotation.js";

test("camera easing reaches the same position in equal time at 30, 60 and 120 FPS", () => {
  const positions = [30, 60, 120].map((fps) => {
    let value = 0;
    for (let frame = 0; frame < fps / 2; frame++) value = THREE.MathUtils.lerp(value, 100, frameAlpha(.1, 1 / fps));
    return value;
  });
  assert.ok(Math.abs(positions[0] - positions[1]) < 1e-10);
  assert.ok(Math.abs(positions[1] - positions[2]) < 1e-10);
  assert.ok(Math.abs(frameAlpha(.1, 1 / 60) - .1) < 1e-12);
});

test("sleep and malformed delta never teleport the scene or create NaN", () => {
  assert.equal(animationDelta(3), .05);
  for (const delta of [-1, NaN, Infinity, 0]) assert.equal(animationDelta(delta), 0);
  assert.ok(frameAlpha(.1, 12) < .28);
  assert.equal(frameAlpha(.1, NaN), 0);
});

test("adaptive resolution reacts to sustained load, with cooldown and recovery hysteresis", () => {
  const quality = createQualityState(1.5);
  for (let frame = 0; frame < 300; frame++) updateQuality(quality, 1 / 40);
  assert.equal(quality.dpr, 1.25);
  for (let frame = 0; frame < 300; frame++) updateQuality(quality, 1 / 40);
  assert.equal(quality.dpr, 1);
  for (let frame = 0; frame < 300; frame++) updateQuality(quality, 1 / 60);
  assert.equal(quality.dpr, 1);
  for (let frame = 0; frame < 600; frame++) updateQuality(quality, 1 / 60);
  assert.equal(quality.dpr, 1.25);
  for (let frame = 0; frame < 1800; frame++) updateQuality(quality, 1 / 60);
  assert.equal(quality.dpr, 1.5);
  updateQuality(quality, 20);
  assert.equal(quality.dpr, 1.5);
});

test("one slow frame does not blur a high resolution device", () => {
  const quality = createQualityState(2);
  for (let frame = 0; frame < 600; frame++) updateQuality(quality, frame === 200 ? .08 : 1 / 60);
  assert.equal(quality.dpr, 2);
});

test("camera rotation samples reuse their output and remain continuous at route boundaries", () => {
  const targets = [
    { progress: 0, rotation: new THREE.Euler(0, -.2, 0) },
    { progress: .5, rotation: new THREE.Euler(-.1, .1, 0) },
    { progress: 1, rotation: new THREE.Euler(0, 0, 0) },
  ];
  const sample = createRotationSampler(targets), output = new THREE.Quaternion();
  assert.equal(sample(.25, false, output), output);
  const left = sample(.5 - 1e-8, false, output).clone();
  assert.ok(left.angleTo(sample(.5 + 1e-8, false, output)) < 1e-7);
  const end = sample(1, false, output).clone();
  assert.ok(end.angleTo(sample(0, true, output)) < 1e-12);
});
