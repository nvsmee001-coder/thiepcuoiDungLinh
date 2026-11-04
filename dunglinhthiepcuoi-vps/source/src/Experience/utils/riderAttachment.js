import * as THREE from "three";
import { BIKE_BOARD_END, getFlightStage } from "./flightLanding.js";

export const RIDER_SCALE = 0.28;
export const RIDER_CONTACT_Y = { bike: -1.58, boat: -1.745897889137268, plane: -1.58, jump: -1.58 };
const anchorPosition = new THREE.Vector3();
const anchorRotation = new THREE.Quaternion();
const up = new THREE.Vector3();
const phonePoint = new THREE.Vector3();
const cameraLocalPoint = new THREE.Vector3();
const phoneProjection = new THREE.Vector3();
const cameraRight = new THREE.Vector3();

export function getRiderMode(progress, transitioning = false) {
  if (!Number.isFinite(progress)) return "walk";
  if (transitioning) {
    const stage = getFlightStage(progress);
    return stage === "jump" || stage === "bike" ? stage : "plane";
  }
  if (progress >= 0 && progress < BIKE_BOARD_END) return "walk";
  if (progress >= 0 && progress <= 0.3) return "bike";
  if (progress >= 0.31 && progress <= 0.49) return "boat";
  return "walk";
}

// +Y is up; the figure faces +Z. Vehicle anchors are the authoritative
// seat/deck contacts, including the vehicle's bob, tilt and loop translation.
export function attachRider(rider, anchor, mode) {
  anchor.updateWorldMatrix(true, false);
  anchor.getWorldPosition(anchorPosition);
  anchor.getWorldQuaternion(anchorRotation);
  up.set(0, 1, 0).applyQuaternion(anchorRotation);
  rider.position.copy(anchorPosition).addScaledVector(up, -RIDER_CONTACT_Y[mode] * RIDER_SCALE);
  rider.quaternion.copy(anchorRotation);
}

export function frameRiderOnScreen(cameraGroup, camera, rider, targetX, targetY) {
  cameraGroup.updateWorldMatrix(true, true);
  camera.updateMatrixWorld();
  rider.getWorldPosition(phonePoint);
  cameraLocalPoint.copy(phonePoint).applyMatrix4(camera.matrixWorldInverse);
  const depth = -cameraLocalPoint.z;
  if (depth <= camera.near) return;
  phoneProjection.copy(phonePoint).project(camera);
  const halfHeight = depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.getWorldQuaternion(anchorRotation);
  cameraRight.set(1, 0, 0).applyQuaternion(anchorRotation);
  up.set(0, 1, 0).applyQuaternion(anchorRotation);
  cameraGroup.position.addScaledVector(cameraRight, (phoneProjection.x - targetX) * halfHeight * camera.aspect);
  cameraGroup.position.addScaledVector(up, (phoneProjection.y - targetY) * halfHeight);
  cameraGroup.updateWorldMatrix(true, true);
  camera.updateMatrixWorld();
}

export function framePhoneRider(cameraGroup, camera, rider) {
  frameRiderOnScreen(cameraGroup, camera, rider, -.46, -.4);
}
