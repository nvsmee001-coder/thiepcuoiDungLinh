import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "../utils/gltfLoader";
import { useKTX2Texture } from "../utils/ktxLoader";
import { expandWorldX } from "../utils/cityLayout";
import { hanoiBikeX, HANOI_BIKE_START_X, HANOI_BIKE_LIFT } from "../utils/hanoiCycling";

// Reuse the supplied pencil bicycle, basket, texture and separate wheel meshes.
// It lives outside CityLayout so the frame and wheels keep their proportions.
export default function HanoiBicycle({ scrollProgress, transitioning, riderAnchors }) {
  const { nodes } = useGLTF("/models/Moving_Extras.glb");
  const material = useKTX2Texture("/textures/Moving_extras.ktx2");
  const rig = useRef(), seat = useRef(), front = useRef(), rear = useRef();
  const crank = useRef(), pedal = useRef(), gear = useRef();
  const startX = useMemo(() => expandWorldX(HANOI_BIKE_START_X), []);

  useFrame(() => {
    const x = expandWorldX(hanoiBikeX(scrollProgress.current));
    rig.current.visible = !transitioning?.current;
    rig.current.position.set(x + 20.65, HANOI_BIKE_LIFT, -.05);
    const wheelAngle = -(x - startX) / .31;
    front.current.rotation.y = rear.current.rotation.y = wheelAngle;
    crank.current.rotation.y = gear.current.rotation.y = wheelAngle / 2.4;
    pedal.current.rotation.y = -wheelAngle / 2.4;
    riderAnchors.current.hanoiBike = seat.current;
  }, -3);

  return <group ref={rig} name="Hanoi_bicycle" dispose={null}>
    <object3D ref={seat} name="Hanoi_bicycle_seat" position={[-20.65, 1.08, -1.23]} />
    <group ref={crank} position={[-20.535, .616, -1.381]} rotation={[-Math.PI / 2, 0, -Math.PI]}>
      <mesh geometry={nodes.Bike_Pedal_Holder.geometry} material={material} />
      <mesh ref={pedal} geometry={nodes.Bike_Pedal.geometry} material={material} position={[-.138, .002, .005]} />
    </group>
    <mesh geometry={nodes.Bike_Stick.geometry} material={material}
      position={[-20.497, .378, -1.48]} rotation={[Math.PI, 0, Math.PI]} scale={[1.523, 1, 1.523]} />
    <mesh geometry={nodes.Bike_Body.geometry} material={material}
      position={[-20.607, .901, -1.391]} rotation={[-Math.PI / 2, 0, -Math.PI]} />
    <mesh ref={rear} geometry={nodes.Bike_Bake_Wheel.geometry} material={material}
      position={[-20.918, .666, -1.392]} rotation={[Math.PI / 2, 0, 0]} />
    <mesh ref={front} geometry={nodes.Bike_Front_Wheel.geometry} material={material}
      position={[-19.978, .664, -1.395]} rotation={[Math.PI / 2, 0, 0]} />
    <mesh ref={gear} geometry={nodes.Plane107.geometry} material={material}
      position={[-20.537, .615, -1.385]} rotation={[-Math.PI / 2, 0, -Math.PI]} />
  </group>;
}

useGLTF.preload("/models/Moving_Extras.glb");
