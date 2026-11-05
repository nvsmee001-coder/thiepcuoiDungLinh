import { BIKE_BOARD_END, getFlightStage } from "../utils/flightLanding";
import { animationDelta, frameAlpha } from "../utils/frameTiming";
import React, { useRef, useState, useMemo } from "react";
import { useGLTF } from "../utils/gltfLoader";
import { useScrollCurve } from "../hooks/useScrollCurve";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { attachRider, getRiderMode, RIDER_SCALE } from "../utils/riderAttachment";
import CharacterWardrobe from "../components/CharacterWardrobe";
import {
  initialPandaPoints,
  PANDA_SHIFT_X_AMOUNT,
  pandaCurve,
} from "../components/curve";

export default function Model({ scrollProgress, cameraScrollCurve, riderAnchors, riderRef, ...props }) {
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
  const duckYOffsetRef = useRef(0);

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

      // Cú nhảy Parabol bay qua đầu cô dâu chú rể (ảnh 2): bắt đầu sau nhịp khựng (từ 0.84 đến 0.902)
      const jumpStart = 0.84;
      const jumpEnd = 0.902;
      let jumpY = 0;
      let jumpRotZ = 0;
      if (!cameraScrollCurve.transitionCurveActive.current && currentProgress >= jumpStart && currentProgress <= jumpEnd) {
        const t = (currentProgress - jumpStart) / (jumpEnd - jumpStart);
        jumpY = Math.sin(Math.PI * t) * 4.3;
        jumpRotZ = Math.sin(Math.PI * 2 * t) * -0.28;
      }

      if (mode !== previousMode.current) {
        supportMeshes.forEach((object) => { object.visible = mode === "walk" && !introWalk; });
        state.gl.domElement.dataset.transport = mode;
        previousMode.current = mode;
      }
      if (introWalk && riderAnchors?.current.walkStart) {
        attachRider(pandaRef.current, riderAnchors.current.walkStart, "bike");
        return;
      }
      // Seat, deck and plane attachments have one authoritative transform.
      if (mode !== "walk") {
        const anchor = riderAnchors?.current[mode];
        if (anchor) { attachRider(pandaRef.current, anchor, mode); return; }
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

      // Hạ vị trí thú mỏ vịt đứng vừa vặn trên đường kẻ chân trang notebook (0.76 -> 0.94),
      // không bị chìm xuống chân màn hình, không che dâu rể hay thiệp.
      // Sau đó từ 0.94 -> 1.0 mượt mà bước dần lên độ cao xuất phát chuẩn của máy bay.
      let duckYOffsetTarget = 0;
      if (!cameraScrollCurve.transitionCurveActive.current && currentProgress >= 0.76) {
        if (currentProgress <= 0.94) {
          duckYOffsetTarget = -0.38;
        } else if (currentProgress < 1.0) {
          const climbT = Math.min(1, Math.max(0, (currentProgress - 0.94) / 0.05));
          duckYOffsetTarget = THREE.MathUtils.lerp(-0.38, 0, climbT);
        }
      }
      duckYOffsetRef.current = THREE.MathUtils.lerp(duckYOffsetRef.current, duckYOffsetTarget, alpha);

      pandaRef.current.position.x = THREE.MathUtils.lerp(
        pandaRef.current.position.x,
        pandaPoint.x + randomOffset.position.x,
        alpha
      );
      pandaRef.current.position.y = THREE.MathUtils.lerp(
        pandaRef.current.position.y,
        pandaPoint.y + 6.55845 + randomOffset.position.y + duckYOffsetRef.current + jumpY,
        alpha
      );
      pandaRef.current.position.z = THREE.MathUtils.lerp(
        pandaRef.current.position.z,
        pandaPoint.z + randomOffset.position.z,
        alpha
      );

      pandaRef.current.rotation.x = randomOffset.rotation.x;
      pandaRef.current.rotation.y = 0 + randomOffset.rotation.y;
      pandaRef.current.rotation.z = randomOffset.rotation.z + jumpRotZ;
    }
  }, -2);

  return (
    <group {...props} dispose={null}>
      <group ref={pandaRef} position={[-20.664, 1.5, -1.466]}>
        {/* +Y up, +Z facing: model scale and contact offsets are shared with the rigs. */}
        <group scale={RIDER_SCALE}>
          <primitive object={character} />
          <CharacterWardrobe scrollProgress={scrollProgress} cameraScrollCurve={cameraScrollCurve} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/thu_mo_vit_xanh_2d.glb");
