import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function RowingPaddle({ joint, rowing }) {
  const grip = useRef();
  const map = useTexture("/scenery/wooden-paddle.svg");
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace; }, [map]);

  useFrame(({ scene }) => {
    if (!grip.current) return;
    const strength = Number(rowing?.current) || 0;
    grip.current.visible = strength > .01;
    grip.current.scale.setScalar(strength);
    const time = scene.userData.animationTime || 0;
    grip.current.rotation.z = 0.4 + Math.sin(time * 1.8) * 0.1;
  });

  if (!joint) return null;
  return createPortal(
    <group ref={grip} position={[0.57, 0.2, 0.2]} rotation={[0, 0, 0.4]} visible={false}>
      {/* The shaft's top grip is 3.5% down the five-unit image. */}
      <mesh position={[0, -2.325, 0]}>
        <planeGeometry args={[1, 5]} />
        <meshBasicMaterial map={map} transparent alphaTest={0.06}
          side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
      </mesh>
    </group>,
    joint,
  );
}
