import test from "node:test";
import assert from "node:assert/strict";
import { CITY_REGIONS, CITY_START, CITY_END, expandWorldX, expandedVehicleOffset, cityTravelSpeed } from "./cityLayout.js";
import { createMilkFlowers, sampleMilkFlower, flowerOpacity, HANOI_FLOWER_BOUNDS } from "./milkFlowerSystem.js";

test("all four destinations gain exactly 25% of travel space", () => {
  for (const region of CITY_REGIONS) {
    const width = expandWorldX(region.end) - expandWorldX(region.start);
    assert.ok(Math.abs(width / (region.end - region.start) - 1.25) < 1e-12);
  }
  for (const edge of [CITY_START, CITY_END]) {
    assert.ok(expandWorldX(edge + .00001) - expandWorldX(edge - .00001) < .00003);
  }
  assert.equal(expandWorldX(38.258) - expandWorldX(32.258), 6);
  assert.equal(cityTravelSpeed(expandWorldX(12)), .8);
  assert.equal(cityTravelSpeed(expandWorldX(32)), 1);
});

test("rigid bike and yacht anchors arrive at the expanded route positions", () => {
  for (const [anchor, travel] of [[-20.65, 16.89], [-2.45, 10]]) {
    for (const t of [0, .25, .5, .75, 1]) {
      assert.ok(Math.abs(anchor + expandedVehicleOffset(anchor, travel * t) - expandWorldX(anchor + travel * t)) < 1e-12);
    }
  }
});

test("flower pool is deterministic, stays inside Hanoi and handles long frame times", () => {
  const flowers = createMilkFlowers();
  assert.deepEqual(flowers, createMilkFlowers());
  const sample = {};
  for (const time of [0, .016, 4, 600, 100000]) for (const flower of flowers) {
    assert.equal(sampleMilkFlower(flower, time, sample), sample);
    assert.ok(sample.y >= HANOI_FLOWER_BOUNDS.bottom && sample.y <= HANOI_FLOWER_BOUNDS.top);
    assert.ok(sample.x >= HANOI_FLOWER_BOUNDS.left && sample.x <= HANOI_FLOWER_BOUNDS.right);
    assert.ok(sample.size > 0 && sample.size < .15);
  }
  const initial = { ...sampleMilkFlower(flowers[0], 0, sample, true) };
  assert.deepEqual(sampleMilkFlower(flowers[0], 100, sample, true), initial);
});

test("flowers fade at Hanoi boundaries and never appear during another destination or loop", () => {
  for (const progress of [0, .2, .4, .475, .615, .7, 1]) assert.equal(flowerOpacity(progress), 0);
  assert.equal(flowerOpacity(.55), .88);
  assert.equal(flowerOpacity(.55, true), 0);
  assert.ok(flowerOpacity(.48) > 0 && flowerOpacity(.48) < .88);
});
