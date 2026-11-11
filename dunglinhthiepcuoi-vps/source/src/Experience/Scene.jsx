import { frameAlpha } from "./utils/frameTiming";
import { advanceInvitationLift, INVITATION_CLOSE_TRIGGER } from "./utils/invitationTransition";
import { createRotationSampler } from "./utils/cameraRotation";
import RendererWarmup from "./components/RendererWarmup";
import FlightTransport from "./components/FlightTransport";
import PhotoMemoryProvider from "./components/PhotoMemoryProvider";
import { sceneryLoopIndex, constrainJourneyTarget, stepAutomaticTakeoff, stepAutomaticLanding, BIKE_BOARD_END, FLIGHT_STOP, TAKEOFF_END } from "./utils/flightLanding";
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
  const riderAnchors = useRef({ bike: null, hanoiBike: null, boat: null, plane: null, jump: null, walkStart: null });
  const automaticLanding = useRef({ active: false });
  const automaticTakeoff = useRef({ cancelled: false });
  const invitationTransition = useRef({ lifting: false, lift: 0, elapsed: 0, phase: "idle", reopening: false });
  const invitationCamera = useMemo(() => ({
    position: new THREE.Vector3(), rotation: new THREE.Quaternion(),
    localPosition: new THREE.Vector3(), localRotation: new THREE.Quaternion(),
  }), []);
  const riderRef = useRef();
  const framingTarget = useMemo(() => new THREE.Object3D(), []);
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

  useFrame((state, delta) => {
    const flying = cameraScrollCurve.transitionCurveActive.current;
    if (!flying) {
      automaticLanding.current.active = false;
      automaticTakeoff.current.cancelled = false;
    }
    const takeoffProgress = flying ? stepAutomaticTakeoff(
      automaticTakeoff.current, scrollProgress.current, targetScrollProgress.current, delta,
    ) : null;
    const automaticProgress = takeoffProgress ?? (flying ? stepAutomaticLanding(
      automaticLanding.current, scrollProgress.current, targetScrollProgress.current, delta,
    ) : null);
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

    const closing = invitationTransition.current;
    if (!flying && closing.phase === "flight") {
      closing.phase = "idle"; closing.lift = 0;
    }
    if (!flying && !closing.lifting && newProgress >= INVITATION_CLOSE_TRIGGER && targetScrollProgress.current >= 1) {
      closing.lifting = true; closing.phase = "lifting"; closing.elapsed = 0;
      closing.reopening = false; closing.lift = 0;
      invitationCamera.position.copy(cameraGroup.current.position);
      invitationCamera.rotation.copy(cameraGroup.current.quaternion);
      invitationCamera.localPosition.copy(camera.current.position);
      invitationCamera.localRotation.copy(camera.current.quaternion);
      targetScrollProgress.current = INVITATION_CLOSE_TRIGGER;
    }
    if (closing.lifting) {
      const reverse = targetScrollProgress.current < INVITATION_CLOSE_TRIGGER - .002;
      if (reverse) closing.resumeTarget = targetScrollProgress.current;
      advanceInvitationLift(closing, delta, reverse);
      newProgress = INVITATION_CLOSE_TRIGGER;
      targetScrollProgress.current = INVITATION_CLOSE_TRIGGER;
      if (closing.complete) {
        closing.lifting = false; closing.phase = "flight";
        cameraScrollCurve.transitionCurveActive.current = true;
        cameraScrollCurve.initiateTransitionCurve();
        automaticTakeoff.current.cancelled = false;
        newProgress = 0; targetScrollProgress.current = 0;
      } else if (closing.cancelled) {
        closing.lifting = false; closing.phase = "idle";
        targetScrollProgress.current = closing.resumeTarget ?? INVITATION_CLOSE_TRIGGER;
      }
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
      scrollSpeedMultiplier.current = newProgress < TAKEOFF_END ? 1.5 : newProgress <= 0.95 ? 6 : 1;
    } else {
      const localX = cameraScrollCurve.getCurrentPoint(newProgress).x - SHIFT_X_AMOUNT * (cameraScrollCurve.loopCounter.current - 1);
      scrollSpeedMultiplier.current = cityTravelSpeed(localX);
    }

    // Keep the same notebook backdrop while the card lifts and the plane rises.
    if (sceneGroupRef.current) sceneGroupRef.current.position.x = SHIFT_X_AMOUNT * sceneryLoopIndex(
      cameraScrollCurve.loopCounter.current, cameraScrollCurve.transitionCurveActive.current, newProgress,
    );
    const cardStage = closing.lifting ? "lifting" : cameraScrollCurve.transitionCurveActive.current ? "flight" : "idle";
    if (state.gl.domElement.dataset.cardTransition !== cardStage) state.gl.domElement.dataset.cardTransition = cardStage;
    const cardLift = closing.lift.toFixed(3);
    if (state.gl.domElement.dataset.cardLift !== cardLift) state.gl.domElement.dataset.cardLift = cardLift;
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

    const closing = invitationTransition.current;
    if (closing.lifting) {
      // Pull straight up in the visitor's current view; no zoom or camera pan.
      cameraGroup.current.position.copy(invitationCamera.position);
      cameraGroup.current.quaternion.copy(invitationCamera.rotation);
      camera.current.position.copy(invitationCamera.localPosition);
      camera.current.quaternion.copy(invitationCamera.localRotation);
      cameraGroup.current.updateMatrixWorld(true);
      camera.current.updateMatrixWorld();
      return;
    }


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
    if (phone && riderRef.current) framePhoneRider(cameraGroup.current, camera.current, framingTarget);
    else if (cameraScrollCurve.transitionCurveActive.current && riderRef.current) {
      frameRiderOnScreen(cameraGroup.current, camera.current, framingTarget, 0, .1);
    }
  }, -1);

  return (
    <PhotoMemoryProvider riderRef={riderRef}>
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
          framingTarget={framingTarget}
        />
        <group ref={singleSheetRef}>
          <SingleSheet scrollProgress={scrollProgress} transitioning={cameraScrollCurve.transitionCurveActive}
            transitionRef={invitationTransition} />
        </group>
      </Suspense>
    </PhotoMemoryProvider>
  );
};

export default Scene;
