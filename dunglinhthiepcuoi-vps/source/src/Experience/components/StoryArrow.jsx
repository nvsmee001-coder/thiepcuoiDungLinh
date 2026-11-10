import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function StoryArrow() {
  const arrow = useRef();
  const map = useTexture("/scenery/story-crayon-arrow.svg");
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace; }, [map]);
  useFrame(({ scene }) => {
    const time = scene.userData.animationTime || 0;
    // Reuse the scene clock and transform only; the wax texture stays static.
    arrow.current.rotation.z = Math.sin(time * 2.1) * .055;
    arrow.current.position.x = .28 + Math.sin(time * 2.1) * .012;
  });
  return <mesh ref={arrow} position={[.28, .10, .025]} renderOrder={3} raycast={() => null}>
    <planeGeometry args={[.8, .267]} />
    <meshBasicMaterial map={map} transparent alphaTest={.03} depthWrite={false}
      side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
  </mesh>;
}
