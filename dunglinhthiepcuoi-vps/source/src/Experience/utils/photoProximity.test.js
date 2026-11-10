import test from "node:test";
import assert from "node:assert/strict";
import { chooseNearbyPhoto, shouldPreloadPhoto } from "./photoProximity.js";

test("neighboring photos open one at a time and switch only when substantially closer", () => {
  const triggers = [{ id: "first", x: 0 }, { id: "second", x: 1.4 }];
  let current = chooseNearbyPhoto(triggers, 0, null);
  assert.equal(current, "first");
  current = chooseNearbyPhoto(triggers, .75, current);
  assert.equal(current, "first");
  current = chooseNearbyPhoto(triggers, .9, current);
  assert.equal(current, "second");
  current = chooseNearbyPhoto(triggers, .6, current);
  assert.equal(current, "second");
  assert.equal(chooseNearbyPhoto(triggers, .5, current), "first");
});

test("entry and exit radii prevent flicker at a photo's boundary", () => {
  const triggers = [{ id: "photo", x: 0 }];
  assert.equal(chooseNearbyPhoto(triggers, 1.15, null), "photo");
  assert.equal(chooseNearbyPhoto(triggers, 1.2, "photo"), "photo");
  assert.equal(chooseNearbyPhoto(triggers, 1.65, "photo"), "photo");
  assert.equal(chooseNearbyPhoto(triggers, 1.651, "photo"), null);
  assert.equal(chooseNearbyPhoto(triggers, 1.2, null), null);
  assert.equal(chooseNearbyPhoto(triggers, 1.14, null), "photo");
});

test("ties resolve by ID regardless of registration order and accept any iterable", () => {
  const triggers = [{ id: "z-photo", x: -1 }, { id: "a-photo", x: 1 }];
  assert.equal(chooseNearbyPhoto(triggers, 0, null), "a-photo");
  assert.equal(chooseNearbyPhoto(new Set([...triggers].reverse()), 0, null), "a-photo");
});

test("disabled plane photos clear immediately and marker height does not affect route distance", () => {
  const plane = { id: "plane", x: 0, y: 5, enabled: false };
  assert.equal(chooseNearbyPhoto([plane], 0, "plane"), null);
  assert.equal(chooseNearbyPhoto([plane, { id: "nearby", x: .5, y: 100, enabled: true }], 0, "plane"), "nearby");
});

test("a dismissed photo stays excluded until the caller enables it after leaving", () => {
  const photo = { id: "photo", x: 0, enabled: true };
  assert.equal(chooseNearbyPhoto([photo], 0, null), "photo");
  photo.enabled = false;
  assert.equal(chooseNearbyPhoto([photo], .1, null), null);
  assert.equal(chooseNearbyPhoto([photo], 2, null), null);
  photo.enabled = true;
  assert.equal(chooseNearbyPhoto([photo], 1, null), "photo");
});

test("custom radii and switch margins are honored without mutating the registry", () => {
  const triggers = Object.freeze([
    Object.freeze({ id: "first", x: 0, enterRadius: .5, exitRadius: .8 }),
    Object.freeze({ id: "second", x: 1, enterRadius: .6, exitRadius: 1 }),
  ]);
  assert.equal(chooseNearbyPhoto(triggers, .6, null), "second");
  assert.equal(chooseNearbyPhoto(triggers, .6, "first"), "first");
  assert.equal(chooseNearbyPhoto(triggers, .6, "first", { switchMargin: .1 }), "second");
  assert.equal(chooseNearbyPhoto(triggers, .81, "first"), "second");
});

test("invalid coordinates are ignored and invalid rider positions clear selection", () => {
  const triggers = [null, { id: "nan", x: NaN }, { id: "infinite", x: Infinity }, { id: "string", x: "0" }];
  assert.equal(chooseNearbyPhoto(triggers, 0, "nan"), null);
  assert.equal(chooseNearbyPhoto([...triggers, { id: "valid", x: 0 }], 0, null), "valid");
  for (const x of [NaN, Infinity, -Infinity, undefined, "0"]) {
    assert.equal(chooseNearbyPhoto([{ id: "valid", x: 0 }], x, "valid"), null);
  }
  assert.equal(chooseNearbyPhoto(null, 0, null), null);
  assert.equal(chooseNearbyPhoto({}, 0, null), null);
});

test("preloading starts within the route radius in either direction with finite coordinates", () => {
  assert.equal(shouldPreloadPhoto(6, 0), true);
  assert.equal(shouldPreloadPhoto(-6, 0), true);
  assert.equal(shouldPreloadPhoto(6.01, 0), false);
  assert.equal(shouldPreloadPhoto(2, 0, 2), true);
  assert.equal(shouldPreloadPhoto(0, 0, 0), true);
  for (const x of [NaN, Infinity, undefined, "0"]) {
    assert.equal(shouldPreloadPhoto(x, 0), false);
    assert.equal(shouldPreloadPhoto(0, x), false);
  }
  assert.equal(shouldPreloadPhoto(0, 0, -1), false);
  assert.equal(shouldPreloadPhoto(0, 0, Infinity), false);
});
