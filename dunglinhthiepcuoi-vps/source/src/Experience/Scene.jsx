import { frameAlpha } from "./utils/frameTiming";
import { createRotationSampler } from "./utils/cameraRotation";
import RendererWarmup from "./components/RendererWarmup";
import FlightTransport from "./components/FlightTransport";
import { sceneryLoopIndex, constrainJourneyTarget, stepAutomaticLanding, BIKE_BOARD_END, FLIGHT_STOP } from "./utils/flightLanding";
import CityLayout from "./components/CityLayout";
import { cityTravelSpeed } from "./utils/cityLayout";
import { React, Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { isPhoneViewport } from "./utils/mobileCharacterLayout";
import { framePhoneRider, frameRiderOnScreen } from "./utils/riderAttachment";
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

const SINGLE_FORWARD_TRIGGER = 0.5;
const SINGLE_BACK_TRIGGER = 0.35;
const sampleCameraRotation = createRotationSampler(rotationTargets);

const Scene = ({
  cameraGroup,
  camera,
  scrollProgress,
  targetScrollProgress,
  onReady,
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
  const riderAnchors = useRef({ bike: null, boat: null, plane: null, jump: null, walkStart: null });
  const automaticLanding = useRef({ active: false });
  const riderRef = useRef();
  const size = useThree((state) => state.size);
  const singleSheetRef = useRef();

  const shiftSingleSheet = (direction = "forward") => {
    if (!singleSheetRef.current) return;
    const offset =
      direction === "forward"
        ? SHIFT_X_AMOUNT * cameraScrollCurve.loopCounter.current
        : SHIFT_X_AMOUNT * (cameraScrollCurve.loopCounter.current - 1);
    singleSheetRef.current.position.x = offset;
  };

  const rotationBufferQuat = useMemo(() => new THREE.Quaternion().setFromEuler(rotationTargets[0].rotation), []);
  const targetRotation = useMemo(() => new THREE.Quaternion(), []);
  const phone = useMemo(() => isPhoneViewport(size.width, size.height, window.matchMedia("(pointer: coarse)").matches), [size.width, size.height]);

  useFrame((_, delta) => {
    const flying = cameraScrollCurve.transitionCurveActive.current;
    if (!flying) automaticLanding.current.active = false;
    const automaticProgress = flying ? stepAutomaticLanding(
      automaticLanding.current, scrollProgress.current, targetScrollProgress.current, delta,
    ) : null;
    let newProgress;
    if (automaticProgress !== null) {
      // One clock owns touchdown and the jump, even after scrolling stops.
      newProgress = automaticProgress;
      targetScrollProgress.current = automaticProgress;
    } else {
      targetScrollProgress.current = constrainJourneyTarget(
        targetScrollProgress.current, flying, cameraScrollCurve.loopCounter.current,
      );
      newProgress = THREE.MathUtils.lerp(scrollProgress.current, targetScrollProgress.current, frameAlpha(.1, delta));
    }

    if (newProgress >= 1) {
      if (cameraScrollCurve.transitionCurveActive.current) {
        cameraScrollCurve.transitionCurveActive.current = false;
        cameraScrollCurve.shiftCurvePoints("forward");
        cameraScrollCurve.loopCounter.current++;
        automaticLanding.current.active = false;
        // The rider has already boarded the next bicycle. Do not replay the
        // opening walk or move the seat underneath the rider at the handoff.
        newProgress = BIKE_BOARD_END;
        targetScrollProgress.current = BIKE_BOARD_END;
      } else {
        cameraScrollCurve.transitionCurveActive.current = true;
        cameraScrollCurve.initiateTransitionCurve();
        newProgress = Math.min(FLIGHT_STOP, newProgress - 1);
        targetScrollProgress.current = Math.min(FLIGHT_STOP, targetScrollProgress.current - 1);
      }
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
      automaticLanding.current.active = false;
    }

    scrollProgress.current = newProgress;

    if (cameraScrollCurve.transitionCurveActive.current) {
      scrollSpeedMultiplier.current = newProgress <= 0.95 ? 6 : 1;
    } else {
      const localX = cameraScrollCurve.getCurrentPoint(newProgress).x - SHIFT_X_AMOUNT * (cameraScrollCurve.loopCounter.current - 1);
      scrollSpeedMultiplier.current = cityTravelSpeed(localX);
    }

    // Keep the next notebook wall away from both final invitations. Swap the
    // scenery only once the plane is over the gap; reversing uses the same edge.
    if (sceneGroupRef.current) sceneGroupRef.current.position.x = SHIFT_X_AMOUNT * sceneryLoopIndex(
      cameraScrollCurve.loopCounter.current, cameraScrollCurve.transitionCurveActive.current, newProgress,
    );
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

  }, -4);

  useFrame((_, delta) => {
    const alpha = frameAlpha(.1, delta);
    const newProgress = scrollProgress.current;
    const basePoint = cameraScrollCurve.getCurrentPoint(newProgress);


    cameraGroup.current.position.x = THREE.MathUtils.lerp(
      cameraGroup.current.position.x,
      basePoint.x,
      alpha,
    );
    cameraGroup.current.position.y = THREE.MathUtils.lerp(
      cameraGroup.current.position.y,
      basePoint.y,
      alpha,
    );
    cameraGroup.current.position.z = THREE.MathUtils.lerp(
      cameraGroup.current.position.z,
      basePoint.z,
      alpha,
    );

    camera.current.position.x = THREE.MathUtils.lerp(
      camera.current.position.x,
      mousePositionOffset.current.x,
      alpha,
    );
    camera.current.position.y = THREE.MathUtils.lerp(
      camera.current.position.y,
      -mousePositionOffset.current.y,
      alpha,
    );
    camera.current.position.z = 0;

    sampleCameraRotation(newProgress, cameraScrollCurve.transitionCurveActive.current, targetRotation);
    rotationBufferQuat.slerp(targetRotation, frameAlpha(.05, delta));
    cameraGroup.current.quaternion.copy(rotationBufferQuat);

    camera.current.rotation.x = THREE.MathUtils.lerp(
      camera.current.rotation.x,
      -mouseRotationOffset.current.x,
      alpha,
    );
    camera.current.rotation.y = THREE.MathUtils.lerp(
      camera.current.rotation.y,
      -mouseRotationOffset.current.y,
      alpha,
    );
    const fov = phone ? 42 : 35;
    if (camera.current.fov !== fov) {
      camera.current.fov = fov;
      camera.current.updateProjectionMatrix();
    }
    if (phone && riderRef.current) framePhoneRider(cameraGroup.current, camera.current, riderRef.current);
    else if (cameraScrollCurve.transitionCurveActive.current && riderRef.current) {
      frameRiderOnScreen(cameraGroup.current, camera.current, riderRef.current, 0, .1);
    }
  }, -1);

  return (
    <>
      <Suspense fallback={null}>
        <RendererWarmup onReady={onReady} />
        <group ref={sceneGroupRef}>
          <MovingObjects scrollProgress={scrollProgress} riderAnchors={riderAnchors} transitioning={cameraScrollCurve.transitionCurveActive} />
          <CityLayout>
          <SceneOne scrollProgress={scrollProgress} transitioning={cameraScrollCurve.transitionCurveActive} />
          <SceneTwo />
          <SceneThree scrollProgress={scrollProgress} transitioning={cameraScrollCurve.transitionCurveActive} />
          <SceneFour />
          </CityLayout>
        </group>

        <FlightTransport scrollProgress={scrollProgress} cameraScrollCurve={cameraScrollCurve}
          riderAnchors={riderAnchors} sceneGroupRef={sceneGroupRef} />
        <Panda
          scrollProgress={scrollProgress}
          cameraScrollCurve={cameraScrollCurve}
          riderAnchors={riderAnchors}
          riderRef={riderRef}
        />
        <group ref={singleSheetRef}>
          <SingleSheet scrollProgress={scrollProgress} />
        </group>
      </Suspense>
    </>
  );
};

export default Scene;
