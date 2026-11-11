import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { attachRider, framePhoneRider, frameRiderOnScreen, getRiderMode, RIDER_SCALE } from "./riderAttachment.js";
import { touchNavigationDelta, isPhoneViewport } from "./mobileCharacterLayout.js";

test("seat and deck contacts stay attached under vehicle tilt, bob and loop shifts", () => {
  for (const [mode, contactY] of [["bike", -1.58], ["hanoiBike", -1.02], ["boat", -1.745897889137268], ["plane", -1.58], ["jump", -1.58]]) {
    const vehicle = new THREE.Group(), anchor = new THREE.Object3D(), rider = new THREE.Object3D();
    anchor.position.set(-2.45, 1.6, -.2);
    vehicle.add(anchor);
    for (const shift of [0, 65.922141, 131.844282]) {
      vehicle.position.set(shift, .04, -.2);
      vehicle.rotation.set(.01, .02, -.04);
      attachRider(rider, anchor, mode);
      rider.updateMatrixWorld();
      const contact = new THREE.Vector3(0, contactY * RIDER_SCALE, 0).applyMatrix4(rider.matrixWorld);
      assert.ok(contact.distanceTo(anchor.getWorldPosition(new THREE.Vector3())) < 1e-9);
    }
  }
});

test("phone camera keeps the attached rider inside the left third for both landscape sizes", () => {
  for (const [width, height] of [[844, 390], [932, 430], [667, 375]]) {
    assert.equal(isPhoneViewport(width, height), true);
    const rig = new THREE.Group(), camera = new THREE.PerspectiveCamera(42, width / height, .1, 100);
    rig.add(camera); rig.position.set(5, 4, 10); rig.rotation.set(-.1, .06, 0);
    const rider = new THREE.Object3D(); rider.position.set(2, 2, -1.4); rider.updateMatrixWorld();
    framePhoneRider(rig, camera, rider);
    const screen = rider.position.clone().project(camera);
    assert.ok(Math.abs(screen.x + .46) < 1e-9);
    assert.ok(Math.abs(screen.y + .4) < 1e-9);
  }
});

test("framing the surface lets the diver leave the bottom of a landscape phone", () => {
  const rig = new THREE.Group(), camera = new THREE.PerspectiveCamera(42, 844 / 390, .1, 100);
  const surface = new THREE.Object3D(), diver = new THREE.Object3D();
  rig.add(camera); rig.position.set(5, 4, 10);
  surface.position.set(2, 3, -1.4);
  diver.position.copy(surface.position); diver.position.y -= 8;
  surface.updateMatrixWorld(); diver.updateMatrixWorld();
  framePhoneRider(rig, camera, surface);
  assert.ok(Math.abs(surface.position.clone().project(camera).y + .4) < 1e-9);
  assert.ok(diver.position.clone().project(camera).y < -1.5);
});

test("opening walks first, then cycles; the plane is confined to the loop", () => {
  assert.equal(getRiderMode(0), "walk");
  assert.equal(getRiderMode(.04), "walk");
  assert.equal(getRiderMode(.065), "bike");
  assert.equal(getRiderMode(.15), "bike");
  assert.equal(getRiderMode(.4), "boat");
  assert.equal(getRiderMode(.55), "hanoiBike");
  assert.equal(getRiderMode(.15, true), "plane");
  assert.equal(getRiderMode(.90, true), "plane");
  assert.equal(getRiderMode(.93, true), "jump");
  assert.equal(getRiderMode(.99, true), "bike");
});

test("the final flight stays centered on desktop instead of being clipped at the edge", () => {
  const rig = new THREE.Group(), camera = new THREE.PerspectiveCamera(35, 1280 / 800, .1, 100);
  const rider = new THREE.Object3D(); rider.position.set(54.5, 3.4, -1.28);
  rig.add(camera); rig.position.set(57, 2.5, 5); rig.rotation.set(-.04, -.12, .003);
  frameRiderOnScreen(rig, camera, rider, 0, .1);
  const screen = rider.position.clone().project(camera);
  assert.ok(Math.abs(screen.x) < 1e-9);
  assert.ok(Math.abs(screen.y - .1) < 1e-9);
});

test("left swipes advance and segmented gestures preserve travel distance", () => {
  const viewport = { width: 844, height: 390 };
  const start = { x: 700, y: 200 }, middle = { x: 400, y: 205 }, end = { x: 150, y: 203 };
  const full = touchNavigationDelta(start, end, viewport, "x");
  assert.ok(full > 0);
  assert.equal(touchNavigationDelta(end, start, viewport, "x"), -full);
  assert.ok(Math.abs(full - touchNavigationDelta(start, middle, viewport, "x") - touchNavigationDelta(middle, end, viewport, "x")) < 1e-12);
});
