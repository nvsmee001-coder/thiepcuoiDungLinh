import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBikeTravel } from "../utils/flightLanding";
import { frameAlpha } from "../utils/frameTiming";

// The existing route keeps its internal `bike` anchor key. The new paper car
// and driver share that moving rig, including reverse travel and loop landings.
export const PORSCHE_SEAT = [-20.65, 0.9, -1.23];

export default function PorscheConvertible({ scrollProgress, transitioning }) {
  const [body, wheel] = useTexture([
    "/scenery/porsche-911-crayon.svg",
    "/scenery/porsche-crayon-wheel.svg",
  ]);
  const rear = useRef(), front = useRef();
  useMemo(() => {
    body.colorSpace = wheel.colorSpace = THREE.SRGBColorSpace;
  }, [body, wheel]);
  useFrame((_, delta) => {
    const travel = getBikeTravel(transitioning?.current ? 0 : scrollProgress.current);
    const angle = -(travel * 16.89 * 1.25) / .234;
    const alpha = frameAlpha(.1, delta);
    rear.current.rotation.z = THREE.MathUtils.lerp(rear.current.rotation.z, angle, alpha);
    front.current.rotation.z = rear.current.rotation.z;
  });
  return <group name="Porsche_911_Cabriolet" position={[-20.44, 1.01, 0]}>
    {[[-.825, rear], [.84, front]].map(([x, ref]) => <mesh key={x} ref={ref}
      name={x < 0 ? "Porsche_rear_wheel" : "Porsche_front_wheel"}
      position={[x, -.3, -1.14]}>
      <planeGeometry args={[.54, .54]} />
      <meshBasicMaterial map={wheel} transparent alphaTest={.06}
        side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
    </mesh>)}
    {/* The near door hides the seated figure's feet; its head stays above the open roof. */}
    <mesh name="Porsche_crayon_body" position={[0, 0, -1.12]}>
      <planeGeometry args={[3, 1.2]} />
      <meshBasicMaterial map={body} transparent alphaTest={.06}
        side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
    </mesh>
  </group>;
}
