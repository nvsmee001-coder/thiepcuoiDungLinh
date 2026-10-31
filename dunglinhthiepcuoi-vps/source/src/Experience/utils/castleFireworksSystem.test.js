import test from "node:test";
import assert from "node:assert/strict";
import { createCastleFireworks, stepCastleFireworks, FIREWORKS_CAPACITY } from "./castleFireworksSystem.js";

function simulate(state, seconds, progress, options = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) stepCastleFireworks(state, 1 / 60, { progress, ...options });
}

test("only castle proximity starts launches, including on the return journey", () => {
  const state = createCastleFireworks();
  simulate(state, 2, 0);
  simulate(state, 2, 0.14, { transitioning: true });
  assert.equal(state.launches, 0);
  simulate(state, 3, 0.14);
  assert.ok(state.launches >= 3 && state.bursts >= 2);
  const launches = state.launches;
  simulate(state, 4, 0.3);
  assert.equal(state.launches, launches);
  assert.ok(state.particles.every((p) => !p.alive));
  simulate(state, 0.02, 0.14);
  assert.equal(state.launches, launches + 1);
});

test("rockets ascend from the castle before emitting expanding sparks", () => {
  const state = createCastleFireworks();
  simulate(state, 0.02, 0.14);
  const rocket = state.particles.find((p) => p.alive && p.kind === "rocket");
  const originY = rocket.y;
  simulate(state, 0.25, 0.14);
  assert.ok(rocket.y > originY);
  assert.equal(state.bursts, 0);
  simulate(state, 0.45, 0.14);
  assert.equal(state.bursts, 1);
  assert.ok(state.particles.some((p) => p.alive && p.kind === "spark" && Math.abs(p.x + 1.9) > 0.01));
});

test("a prolonged show stays within the fixed pool and finite castle bounds", () => {
  const state = createCastleFireworks();
  simulate(state, 60, 0.16);
  assert.equal(state.particles.length, FIREWORKS_CAPACITY);
  for (const p of state.particles.filter((p) => p.alive)) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(Math.abs(p.x) < 4 && p.y > 2.5 && p.y < 6.5);
    assert.ok(p.life > p.age && p.age >= 0);
  }
});

test("reduced motion uses fewer launches and sparks", () => {
  const regular = createCastleFireworks(), reduced = createCastleFireworks();
  simulate(regular, 6, 0.14);
  simulate(reduced, 6, 0.14, { reducedMotion: true });
  assert.ok(reduced.launches < regular.launches);
  assert.ok(reduced.particles.filter((p) => p.alive && p.kind === "spark").length < regular.particles.filter((p) => p.alive && p.kind === "spark").length);
});
