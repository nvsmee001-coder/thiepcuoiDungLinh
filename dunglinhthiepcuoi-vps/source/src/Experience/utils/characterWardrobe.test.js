import test from "node:test";
import assert from "node:assert/strict";
import { getCharacterOutfit, OUTFIT_STAGES } from "./characterWardrobe.js";

test("Shanghai clothes wait until the character reaches the castle", () => {
  for (const progress of [0.075, 0.1, 0.125, 0.149]) {
    assert.equal(getCharacterOutfit(progress), null);
  }
  assert.equal(getCharacterOutfit(0.15), "shanghai");
  assert.equal(getCharacterOutfit(0.2), "shanghai");
});

test("each region changes outfits at its entry, including on the return journey", () => {
  for (const direction of [OUTFIT_STAGES, [...OUTFIT_STAGES].reverse()]) {
    for (const stage of direction) {
      const index = OUTFIT_STAGES.indexOf(stage);
      assert.equal(getCharacterOutfit(stage.start), stage.outfit);
      assert.equal(getCharacterOutfit(stage.start - 0.00001), OUTFIT_STAGES[index - 1]?.outfit ?? null);
    }
  }
  assert.equal(getCharacterOutfit(1), "groom");
});

test("welcome and the loop transition clear the previous scene's clothes", () => {
  assert.equal(getCharacterOutfit(0), null);
  for (const progress of [0.1, 0.4, 0.55, 0.65, 0.9]) {
    assert.equal(getCharacterOutfit(progress, true), null);
  }
  for (const invalid of [NaN, Infinity, -0.1, 1.1]) assert.equal(getCharacterOutfit(invalid), null);
});
