import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  BOAT_DOCK_START, BOAT_DOCK_END, HANOI_BOARD_START, HANOI_BOARD_END,
  HANOI_RIDE_END, HANOI_DISMOUNT_END, HANOI_BIKE_START_X, HANOI_BIKE_END_X,
  boatTravelAt, boatMotionWeight, hanoiBikeX, hanoiBoardWeight, hanoiDismountWeight,
} from "./hanoiCycling.js";
import { attachRider, boardHanoiBicycle, dismountHanoiBicycle, getRiderMode } from "./riderAttachment.js";
import { expandWorldX } from "./cityLayout.js";

test("Hanoi mounts at the bank, cycles only through Hanoi, and dismounts before the next story", () => {
  assert.equal(getRiderMode(HANOI_BOARD_START - 1e-8), "boat");
  assert.equal(getRiderMode(HANOI_BOARD_START), "hanoiBoard");
  assert.equal(getRiderMode(HANOI_BOARD_END), "hanoiBike");
  assert.equal(getRiderMode(HANOI_RIDE_END), "hanoiDismount");
  assert.equal(getRiderMode(HANOI_DISMOUNT_END), "walk");
  assert.equal(getRiderMode(.1), "bike");
  for (const p of [.48, .5, .55, .6]) assert.equal(getRiderMode(p, true), "plane");
  assert.ok(expandWorldX(HANOI_BIKE_START_X) - .65 > expandWorldX(7.65));
  assert.ok(expandWorldX(HANOI_BIKE_END_X) + 1.01 < expandWorldX(15));
});

test("the canoe reaches its old dock with zero travel speed and no residual bob", () => {
  const epsilon = 1e-6;
  assert.equal(boatTravelAt(.31), 0);
  assert.equal(boatTravelAt(BOAT_DOCK_END), 1);
  assert.equal(boatTravelAt(.6), 1);
  assert.equal(boatMotionWeight(BOAT_DOCK_START), 1);
  assert.equal(boatMotionWeight(BOAT_DOCK_END), 0);
  assert.ok(Math.abs((boatTravelAt(BOAT_DOCK_START + epsilon) - boatTravelAt(BOAT_DOCK_START - epsilon)) / (2 * epsilon) - 1 / .18) < .001);
  assert.ok((1 - boatTravelAt(BOAT_DOCK_END - epsilon)) / epsilon < .001);
  let previous = 0;
  for (let p=.31; p<=.65; p+=.001) {
    const next=boatTravelAt(p); assert.ok(next>=previous && next<=1); previous=next;
  }
});

test("bicycle waits during boarding and is parked during dismounting, with smooth starts and stops", () => {
  assert.equal(hanoiBikeX(HANOI_BOARD_START), HANOI_BIKE_START_X);
  assert.equal(hanoiBikeX(HANOI_BOARD_END), HANOI_BIKE_START_X);
  assert.equal(hanoiBikeX(HANOI_RIDE_END), HANOI_BIKE_END_X);
  assert.equal(hanoiBikeX(HANOI_DISMOUNT_END), HANOI_BIKE_END_X);
  const epsilon=1e-6;
  assert.ok((hanoiBikeX(HANOI_BOARD_END + epsilon) - HANOI_BIKE_START_X) / epsilon < .001);
  assert.ok((HANOI_BIKE_END_X - hanoiBikeX(HANOI_RIDE_END - epsilon)) / epsilon < .001);
});

test("boarding joins both exact rider poses under tilt and repeated scenery loop shifts", () => {
  for (const shift of [0, 65.922141, 131.844282]) {
    const scene=new THREE.Group(), boat=new THREE.Object3D(), bike=new THREE.Object3D();
    const rider=new THREE.Object3D(), expected=new THREE.Object3D();
    scene.position.x=shift; scene.add(boat,bike);
    boat.position.set(expandWorldX(7.55),3.1,-1.6); boat.rotation.z=.02;
    bike.position.set(expandWorldX(HANOI_BIKE_START_X),2.9,-1.28);
    attachRider(expected,boat,"boat");
    boardHanoiBicycle(rider,boat,bike,hanoiBoardWeight(HANOI_BOARD_START));
    assert.ok(rider.position.distanceTo(expected.position)<1e-10);
    assert.ok(rider.quaternion.angleTo(expected.quaternion)<1e-7);
    attachRider(expected,bike,"hanoiBike");
    boardHanoiBicycle(rider,boat,bike,hanoiBoardWeight(HANOI_BOARD_END));
    assert.ok(rider.position.distanceTo(expected.position)<1e-10);
    assert.ok(rider.quaternion.angleTo(expected.quaternion)<1e-7);
  }
});

test("seeking backward retraces the boarding path without state or position jumps", () => {
  const boat=new THREE.Object3D(),bike=new THREE.Object3D(),rider=new THREE.Object3D();
  boat.position.set(15.46,3.1,-1.6); bike.position.set(16.59,2.9,-1.28);
  const samples=[];
  for(let i=0;i<=200;i++) {
    const p=HANOI_BOARD_START+(HANOI_BOARD_END-HANOI_BOARD_START)*i/200;
    boardHanoiBicycle(rider,boat,bike,hanoiBoardWeight(p));
    samples.push(rider.position.clone());
    if(i) assert.ok(samples[i].distanceTo(samples[i-1])<.02);
  }
  for(let i=200;i>=0;i--) {
    const p=HANOI_BOARD_START+(HANOI_BOARD_END-HANOI_BOARD_START)*i/200;
    boardHanoiBicycle(rider,boat,bike,hanoiBoardWeight(p));
    assert.ok(rider.position.distanceTo(samples[i])<1e-12);
  }
});

test("dismount starts at the bicycle seat and finishes on the existing walking route", () => {
  const bike=new THREE.Object3D(),rider=new THREE.Object3D(),expected=new THREE.Object3D();
  bike.position.set(23.71,2.9,-1.28);
  const walk=new THREE.Vector3(26.3,2.86,-1.41);
  attachRider(expected,bike,"hanoiBike");
  dismountHanoiBicycle(rider,bike,walk,hanoiDismountWeight(HANOI_RIDE_END));
  assert.ok(rider.position.distanceTo(expected.position)<1e-10);
  dismountHanoiBicycle(rider,bike,walk,hanoiDismountWeight(HANOI_DISMOUNT_END));
  assert.ok(rider.position.distanceTo(walk)<1e-10);
});
