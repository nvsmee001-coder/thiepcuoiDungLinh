import React, { useRef, useState, useMemo } from "react";
import { useGLTF } from "../utils/gltfLoader";
import { useScrollCurve } from "../hooks/useScrollCurve";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import CharacterWardrobe from "../components/CharacterWardrobe";
import { isPhoneViewport } from "../utils/mobileCharacterLayout";
import { updateMobileOutfit } from "../utils/mobileCharacterStore";
import { getCharacterOutfit } from "../utils/characterWardrobe";
import {
  initialPandaPoints,
  PANDA_SHIFT_X_AMOUNT,
  pandaCurve,
} from "../components/curve";

export default function Model({ scrollProgress, cameraScrollCurve, ...props }) {
  const { scene } = useGLTF("/models/thu_mo_vit_xanh_2d.glb");
  const pandaRef = useRef();
  const size = useThree((state) => state.size);
  const mobile = isPhoneViewport(size.width, size.height, window.matchMedia("(pointer: coarse)").matches);
  const character = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!object.isMesh) return;
      // Keep the supplied unlit colors; paper remains visible from either side.
      const prepare = (material) => {
        const copy = material.clone();
        copy.side = THREE.DoubleSide;
        return copy;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(prepare)
        : prepare(object.material);
    });
    return clone;
  }, [scene]);

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

      if (mobile) updateMobileOutfit(getCharacterOutfit(currentProgress, cameraScrollCurve.transitionCurveActive.current));

      // Keep the route synchronized while the phone uses a fixed screen
      // presentation, so rotating/resizing back to desktop stays continuous.
      if (!pandaRef.current) return;
      const pandaPoint = pandaScrollCurve.getCurrentPoint(currentProgress);

      randomOffset.time += delta;

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

      pandaRef.current.position.x = THREE.MathUtils.lerp(
        pandaRef.current.position.x,
        pandaPoint.x + randomOffset.position.x,
        0.1
      );
      pandaRef.current.position.y = THREE.MathUtils.lerp(
        pandaRef.current.position.y,
        pandaPoint.y + randomOffset.position.y,
        0.1
      );
      pandaRef.current.position.z = THREE.MathUtils.lerp(
        pandaRef.current.position.z,
        pandaPoint.z + randomOffset.position.z,
        0.1
      );

      pandaRef.current.rotation.x = randomOffset.rotation.x;
      pandaRef.current.rotation.y = 0 + randomOffset.rotation.y;
      pandaRef.current.rotation.z = randomOffset.rotation.z;
    }
  });

  if (mobile) {
    return null;
  }

  return (
    <group {...props} dispose={null}>
      <group ref={pandaRef} position={[-20.664, -5.242, -1.466]}>
        {/* Both assets use +Y up. The supplied character faces +Z already.
            Match the original head height (7.173), while retaining the path's
            bottom-of-stick anchor and the supplied model's own geometry. */}
        <group position={[0, 6.55845, 0.04]} scale={0.28}>
          <primitive object={character} />
          <CharacterWardrobe scrollProgress={scrollProgress} cameraScrollCurve={cameraScrollCurve} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/thu_mo_vit_xanh_2d.glb");
