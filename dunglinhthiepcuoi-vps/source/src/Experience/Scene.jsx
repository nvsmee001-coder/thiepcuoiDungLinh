import { React, Suspense, useState, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import MovingObjects from "./models/Moving_Objects";
import SceneOne from "./models/SceneOne";
import SceneTwo from "./models/SceneTwo";
import SceneThree from "./models/SceneThree";
import SceneFour from "./models/SceneFour";
import SingleSheet from "./models/SingleSheet";
import Panda from "./models/Panda";
import {
  cameraCurve as initialCameraCurve,
  initialCameraPoints,
  SHIFT_X_AMOUNT,
  rotationTargets,
} from "./components/curve";
import { useScrollCurve } from "./hooks/useScrollCurve";

const WORLD_FORWARD_TRIGGER = 0.92;
const WORLD_BACK_TRIGGER = 0.91;
const SINGLE_FORWARD_TRIGGER = 0.5;
const SINGLE_BACK_TRIGGER = 0.35;

const Scene = ({
  cameraGroup,
  camera,
  scrollProgress,
  targetScrollProgress,
  lerpFactor,
  mousePositionOffset,
  mouseRotationOffset,
  scrollSpeedMultiplier,
}) => {
  const cameraScrollCurve = useScrollCurve(
    initialCameraCurve,
    initialCameraPoints,
    SHIFT_X_AMOUNT,
  );

  const sceneGroupRef = useRef();
  const singleSheetRef = useRef();

  const shiftWorld = (direction = "forward") => {
    if (!sceneGroupRef.current) return;
    const offset =
      direction === "forward"
        ? SHIFT_X_AMOUNT * cameraScrollCurve.loopCounter.current
        : SHIFT_X_AMOUNT * (cameraScrollCurve.loopCounter.current - 1);
    sceneGroupRef.current.position.x = offset;
  };

  const shiftSingleSheet = (direction = "forward") => {
    if (!singleSheetRef.current) return;
    const offset =
      direction === "forward"
        ? SHIFT_X_AMOUNT * cameraScrollCurve.loopCounter.current
        : SHIFT_X_AMOUNT * (cameraScrollCurve.loopCounter.current - 1);
    singleSheetRef.current.position.x = offset;
  };

  const [rotationBufferQuat] = useState(
    new THREE.Quaternion().setFromEuler(rotationTargets[0].rotation),
  );

  const getLerpedRotation = (progress) => {
    if (cameraScrollCurve.transitionCurveActive.current) {
      const lerpFactor = (progress - 0) / (1 - 0);
      const startQuaternion = new THREE.Quaternion().setFromEuler(
        rotationTargets[rotationTargets.length - 1].rotation,
      );
      const endQuaternion = new THREE.Quaternion().setFromEuler(
        rotationTargets[0].rotation,
      );
      const lerpingQuaternion = new THREE.Quaternion();
      lerpingQuaternion.slerpQuaternions(
        startQuaternion,
        endQuaternion,
        lerpFactor,
      );
      return lerpingQuaternion;
    } else {
      for (let i = 0; i < rotationTargets.length - 1; i++) {
        const start = rotationTargets[i];
        const end = rotationTargets[i + 1];
        if (progress >= start.progress && progress <= end.progress) {
          const lerpFactor =
            (progress - start.progress) / (end.progress - start.progress);
          const startQuaternion = new THREE.Quaternion().setFromEuler(
            start.rotation,
          );
          const endQuaternion = new THREE.Quaternion().setFromEuler(
            end.rotation,
          );
          const lerpingQuaternion = new THREE.Quaternion();
          lerpingQuaternion.slerpQuaternions(
            startQuaternion,
            endQuaternion,
            lerpFactor,
          );
          return lerpingQuaternion;
        }
      }
    }
    return new THREE.Quaternion().setFromEuler(
      rotationTargets[rotationTargets.length - 1].rotation,
    );
  };

  useFrame(() => {
    let newProgress = THREE.MathUtils.lerp(
      scrollProgress.current,
      targetScrollProgress.current,
      lerpFactor,
    );

    if (newProgress >= 1) {
      if (cameraScrollCurve.transitionCurveActive.current) {
        cameraScrollCurve.transitionCurveActive.current = false;
        cameraScrollCurve.shiftCurvePoints("forward");
        cameraScrollCurve.loopCounter.current++;
      } else {
        cameraScrollCurve.transitionCurveActive.current = true;
        cameraScrollCurve.initiateTransitionCurve();
      }
      scrollProgress.current -= 1;
      targetScrollProgress.current -= 1;
      newProgress -= 1;
    } else if (newProgress < 0) {
      if (cameraScrollCurve.transitionCurveActive.current) {
        cameraScrollCurve.transitionCurveActive.current = false;
        cameraScrollCurve.shiftCurvePoints("backward");
      } else {
        cameraScrollCurve.loopCounter.current--;
        cameraScrollCurve.transitionCurveActive.current = true;
        cameraScrollCurve.initiateTransitionCurve();
      }
      scrollProgress.current += 1;
      targetScrollProgress.current += 1;
      newProgress += 1;
    }

    scrollProgress.current = newProgress;

    if (cameraScrollCurve.transitionCurveActive.current) {
      scrollSpeedMultiplier.current = newProgress <= 0.95 ? 6 : 1;
    } else {
      scrollSpeedMultiplier.current = 1;
    }

    if (
      newProgress > WORLD_FORWARD_TRIGGER &&
      !cameraScrollCurve.transitionCurveActive.current
    ) {
      shiftWorld("forward");
    }
    if (
      newProgress <= WORLD_BACK_TRIGGER &&
      !cameraScrollCurve.transitionCurveActive.current
    ) {
      shiftWorld("backward");
    }
    if (
      newProgress >= SINGLE_FORWARD_TRIGGER &&
      !cameraScrollCurve.transitionCurveActive.current
    ) {
      shiftSingleSheet("forward");
    }
    if (
      newProgress <= SINGLE_BACK_TRIGGER &&
      !cameraScrollCurve.transitionCurveActive.current
    ) {
      shiftSingleSheet("backward");
    }

    const basePoint = cameraScrollCurve.getCurrentPoint(newProgress);

    // console.log(basePoint);

    cameraGroup.current.position.x = THREE.MathUtils.lerp(
      cameraGroup.current.position.x,
      basePoint.x,
      0.1,
    );
    cameraGroup.current.position.y = THREE.MathUtils.lerp(
      cameraGroup.current.position.y,
      basePoint.y,
      0.1,
    );
    cameraGroup.current.position.z = THREE.MathUtils.lerp(
      cameraGroup.current.position.z,
      basePoint.z,
      0.1,
    );

    camera.current.position.x = THREE.MathUtils.lerp(
      camera.current.position.x,
      mousePositionOffset.current.x,
      0.1,
    );
    camera.current.position.y = THREE.MathUtils.lerp(
      camera.current.position.y,
      -mousePositionOffset.current.y,
      0.1,
    );
    camera.current.position.z = 0;

    const targetRotation = getLerpedRotation(newProgress);
    rotationBufferQuat.slerp(targetRotation, 0.05);
    cameraGroup.current.quaternion.copy(rotationBufferQuat);

    camera.current.rotation.x = THREE.MathUtils.lerp(
      camera.current.rotation.x,
      -mouseRotationOffset.current.x,
      0.1,
    );
    camera.current.rotation.y = THREE.MathUtils.lerp(
      camera.current.rotation.y,
      -mouseRotationOffset.current.y,
      0.1,
    );
  });

  return (
    <>
      <Suspense fallback={null}>
        <group ref={sceneGroupRef}>
          <MovingObjects scrollProgress={scrollProgress} />
          <SceneOne scrollProgress={scrollProgress} transitioning={cameraScrollCurve.transitionCurveActive} />
          <SceneTwo />
          <SceneThree scrollProgress={scrollProgress} />
          <SceneFour />
        </group>

        <Panda
          scrollProgress={scrollProgress}
          cameraScrollCurve={cameraScrollCurve}
        />
        <group ref={singleSheetRef}>
          <SingleSheet scrollProgress={scrollProgress} />
        </group>
      </Suspense>
    </>
  );
};

export default Scene;
