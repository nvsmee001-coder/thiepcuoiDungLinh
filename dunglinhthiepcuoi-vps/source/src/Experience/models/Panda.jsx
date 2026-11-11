import { BIKE_BOARD_END, TAKEOFF_END, getFlightStage } from "../utils/flightLanding";
import { animationDelta, frameAlpha } from "../utils/frameTiming";
import React, { useRef, useState, useMemo } from "react";
import { useGLTF } from "../utils/gltfLoader";
import { useScrollCurve } from "../hooks/useScrollCurve";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { attachRider, boardHanoiBicycle, dismountHanoiBicycle, getRiderMode, RIDER_SCALE } from "../utils/riderAttachment";
import { hanoiBoardWeight, hanoiDismountWeight } from "../utils/hanoiCycling";
import CharacterWardrobe from "../components/CharacterWardrobe";
import { DIVE_START, getSwimStage, sampleSwimJourney } from "../utils/swimJourney";
import { createSwimRig } from "../utils/swimRig";
import RowingPaddle from "../components/RowingPaddle";
import DiveWaterDroplets from "../components/DiveWaterDroplets";
import {
  initialPandaPoints,
  PANDA_SHIFT_X_AMOUNT,
  pandaCurve,
} from "../components/curve";

export default function Model({ scrollProgress, cameraScrollCurve, riderAnchors, riderRef, framingTarget, ...props }) {
  const { scene } = useGLTF("/models/thu_mo_vit_xanh_2d.glb");
  const localRef = useRef();
  const pandaRef = riderRef ?? localRef;
  const previousMode = useRef(null);
  const character = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (/stick/i.test(object.name)) object.userData.riderSupport = true;
      if (!object.isMesh) return;
      // Keep the supplied unlit colors; paper remains visible from either side.
      const prepare = (material) => {
        const copy = material.clone();
        copy.side = THREE.DoubleSide;
        copy.forceSinglePass = true;
        return copy;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(prepare)
        : prepare(object.material);
    });
    return clone;
  }, [scene]);
  const swimRig = useMemo(() => createSwimRig(character), [character]);
  const swimPose = useRef({ swimWeight: 0 });
  const rowing = useRef(false);
  const scratch = useMemo(() => ({
    baseline: new THREE.Vector3(-20.664, 1.5, -1.466),
    swimBase: new THREE.Vector3(),
    hanoiWalk: new THREE.Vector3(),
  }), []);

  const supportMeshes = useMemo(() => {
    const supports = [];
    character.traverse((object) => { if (object.userData.riderSupport) supports.push(object); });
    return supports;
  }, [character]);

  const [randomOffset] = useState(() => ({
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    time: 0,
  }));

  const pandaScrollCurve = useScrollCurve(
    pandaCurve,
    initialPandaPoints,
    PANDA_SHIFT_X_AMOUNT
  );

  useFrame((state, delta) => {
    if (scrollProgress && cameraScrollCurve) {
      let currentProgress = scrollProgress.current;
      const progressLabel = currentProgress.toFixed(3);
      const phase = cameraScrollCurve.transitionCurveActive.current ? "flight" : "route";
      const stage = phase === "flight" ? getFlightStage(currentProgress) : "route";
      if (state.gl.domElement.dataset.flightStage !== stage) state.gl.domElement.dataset.flightStage = stage;
      if (state.gl.domElement.dataset.journeyPhase !== phase) state.gl.domElement.dataset.journeyPhase = phase;
      if (state.gl.domElement.dataset.journeyProgress !== progressLabel) {
        state.gl.domElement.dataset.journeyProgress = progressLabel;
      }
      if (
        cameraScrollCurve.transitionCurveActive.current !==
        pandaScrollCurve.transitionCurveActive.current
      ) {
        pandaScrollCurve.transitionCurveActive.current =
          cameraScrollCurve.transitionCurveActive.current;

        if (cameraScrollCurve.transitionCurveActive.current) {
          pandaScrollCurve.loopCounter.current =
            cameraScrollCurve.loopCounter.current;
          pandaScrollCurve.initiateTransitionCurve();
        } else {
          const direction =
            cameraScrollCurve.loopCounter.current >
            pandaScrollCurve.loopCounter.current
              ? "forward"
              : "backward";

          pandaScrollCurve.shiftCurvePoints(direction);
          pandaScrollCurve.loopCounter.current =
            cameraScrollCurve.loopCounter.current;
        }
      }

      // The rider is a scene object on every viewport; there is no detached screen sticker.
      if (!pandaRef.current) return;
      const mode = getRiderMode(currentProgress, cameraScrollCurve.transitionCurveActive.current);
      const introWalk = !cameraScrollCurve.transitionCurveActive.current && currentProgress >= 0 && currentProgress < BIKE_BOARD_END;
      const swimStage = getSwimStage(currentProgress, cameraScrollCurve.transitionCurveActive.current);
      const pose = sampleSwimJourney(currentProgress, cameraScrollCurve.transitionCurveActive.current,
        state.scene.userData.animationTime || 0, swimPose.current);
      rowing.current = !swimStage ? (mode === "boat" ? 1 : mode === "hanoiBoard" ? 1 - hanoiBoardWeight(currentProgress) : 0) : 0;
      if (rowing.current) swimRig.row(state.scene.userData.animationTime || 0, rowing.current);
      else swimRig.update(state.scene.userData.animationTime || 0, swimStage ? pose.swimWeight : 0);
      pandaRef.current.visible = !pose.hidden;
      pandaRef.current.userData.allowMemory = !swimStage
        && (!cameraScrollCurve.transitionCurveActive.current || currentProgress >= TAKEOFF_END);
      for (const support of supportMeshes) support.visible = mode === "walk" && !introWalk && !swimStage;
      const transport = swimStage || mode;
      if (transport !== previousMode.current) {
        state.gl.domElement.dataset.transport = transport;
        previousMode.current = transport;
      }
      if (state.gl.domElement.dataset.swimStage !== (swimStage || "none")) state.gl.domElement.dataset.swimStage = swimStage || "none";
      if (state.gl.domElement.dataset.riderHidden !== String(pose.hidden)) state.gl.domElement.dataset.riderHidden = String(pose.hidden);

      if (cameraScrollCurve.transitionCurveActive.current && mode === "plane" && riderAnchors.current.plane) {
        const anchor = riderAnchors.current.plane;
        attachRider(pandaRef.current, anchor, "plane");
        scratch.baseline.copy(pandaRef.current.position);
        // Follow the unlowered surface: the seated aircraft rises into view
        // instead of the camera following it below the viewport.
        framingTarget.position.copy(pandaRef.current.position);
        framingTarget.position.y -= anchor.userData.takeoffOffset || 0;
        framingTarget.position.x += anchor.userData.frameOffsetX || 0;
        return;
      }
      if (introWalk && riderAnchors?.current.walkStart) {
        attachRider(pandaRef.current, riderAnchors.current.walkStart, "bike");
        scratch.baseline.copy(pandaRef.current.position);
        framingTarget.position.copy(pandaRef.current.position);
        return;
      }
      if (mode === "hanoiBoard" && riderAnchors.current.boat && riderAnchors.current.hanoiBike) {
        boardHanoiBicycle(pandaRef.current, riderAnchors.current.boat,
          riderAnchors.current.hanoiBike, hanoiBoardWeight(currentProgress));
        scratch.baseline.copy(pandaRef.current.position);
        framingTarget.position.copy(pandaRef.current.position);
        return;
      }
      if (mode === "hanoiDismount" && riderAnchors.current.hanoiBike) {
        scratch.hanoiWalk.copy(pandaScrollCurve.getCurrentPoint(currentProgress));
        scratch.hanoiWalk.y += 6.15845;
        dismountHanoiBicycle(pandaRef.current, riderAnchors.current.hanoiBike,
          scratch.hanoiWalk, hanoiDismountWeight(currentProgress));
        scratch.baseline.copy(pandaRef.current.position);
        framingTarget.position.copy(pandaRef.current.position);
        return;
      }
      // Seat, deck and plane attachments have one authoritative transform.
      if (mode !== "walk") {
        const anchor = riderAnchors?.current[mode];
        if (anchor) {
          attachRider(pandaRef.current, anchor, mode);
          scratch.baseline.copy(pandaRef.current.position);
          framingTarget.position.copy(pandaRef.current.position);
          return;
        }
      }
      const pandaPoint = pandaScrollCurve.getCurrentPoint(currentProgress);

      randomOffset.time += animationDelta(delta);
      const alpha = frameAlpha(.1, delta);

      const positionAmplitude = 0.05;
      const rotationAmplitude = 0.02;

      randomOffset.position.x =
        Math.sin(randomOffset.time * 1.8 + 0.5) * positionAmplitude * 0.3;
      randomOffset.position.y =
        Math.sin(randomOffset.time * 1.8 + 1.2) * positionAmplitude * 0.3 - 0.4;
      randomOffset.position.z =
        Math.sin(randomOffset.time * 1.1 + 2.1) * positionAmplitude * 0.2;

      randomOffset.rotation.x =
        Math.sin(randomOffset.time * 2 + 0.8) * rotationAmplitude * 0.2;
      randomOffset.rotation.y =
        Math.sin(randomOffset.time * 0.9 + 1.5) * rotationAmplitude * 0;
      randomOffset.rotation.z =
        Math.sin(randomOffset.time * 0.6 + 2.3) * rotationAmplitude * 0;

      scratch.baseline.x = THREE.MathUtils.lerp(
        scratch.baseline.x,
        pandaPoint.x + randomOffset.position.x,
        alpha
      );
      scratch.baseline.y = THREE.MathUtils.lerp(
        scratch.baseline.y,
        pandaPoint.y + 6.55845 + randomOffset.position.y,
        alpha
      );
      scratch.baseline.z = THREE.MathUtils.lerp(
        scratch.baseline.z,
        pandaPoint.z + randomOffset.position.z,
        alpha
      );

      pandaRef.current.position.copy(scratch.baseline);
      if (swimStage) {
        // Arrive at one fixed surface point, then descend vertically. Keep the
        // camera's baseline on its route so the invitations can scroll past.
        scratch.swimBase.copy(pandaScrollCurve.getCurrentPoint(Math.min(currentProgress, DIVE_START)));
        scratch.swimBase.y += 6.15845;
        pandaRef.current.position.lerp(scratch.swimBase, pose.swimWeight);
      }
      pandaRef.current.position.y += pose.yOffset;
      pandaRef.current.rotation.set(randomOffset.rotation.x, randomOffset.rotation.y,
        swimStage ? pose.bank : randomOffset.rotation.z);
      framingTarget.position.copy(scratch.baseline);
    }
  }, -2);

  return (
    <group {...props} dispose={null}>
      <group ref={pandaRef} position={[-20.664, 1.5, -1.466]}>
        {/* +Y up, +Z facing: model scale and contact offsets are shared with the rigs. */}
        <group scale={RIDER_SCALE}>
          <primitive object={character} />
          <RowingPaddle joint={swimRig.paddleJoint} rowing={rowing} />
          <CharacterWardrobe scrollProgress={scrollProgress} cameraScrollCurve={cameraScrollCurve} swimPose={swimPose} />
        </group>
      </group>
      <DiveWaterDroplets riderRef={pandaRef} swimPose={swimPose}
        scrollProgress={scrollProgress} cameraScrollCurve={cameraScrollCurve} />
    </group>
  );
}

useGLTF.preload("/models/thu_mo_vit_xanh_2d.glb");
