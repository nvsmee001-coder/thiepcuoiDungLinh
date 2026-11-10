import { getBikeTravel, sampleIntroWalk, FLIGHT_STOP } from "../utils/flightLanding";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "../utils/gltfLoader";
import { useKTX2Texture } from "../utils/ktxLoader";
import Canoe from "../components/Canoe";
import { expandedVehicleOffset } from "../utils/cityLayout";
import { animationDelta, frameAlpha } from "../utils/frameTiming";

export default function Model({ scrollProgress, riderAnchors, transitioning, ...props }) {
  const { nodes } = useGLTF("/models/Moving_Extras.glb");
  const material = useKTX2Texture("/textures/Moving_extras.ktx2");
  const bikeGroupRef = useRef(), bikeSeatRef = useRef(), boatDeckRef = useRef(), walkAnchorRef = useRef();
  const frontWheelRef = useRef(), backWheelRef = useRef(), bikePedalHolderRef = useRef();
  const gearRef = useRef(), bikePedalRef = useRef(), shipGroupRef = useRef();
  const offsets = useMemo(() => ({ time: 0, walk: {} }), []);

  useFrame((_, delta) => {
    offsets.time += animationDelta(delta);
    const t = offsets.time, alpha = frameAlpha(.1, delta);
    const progress = transitioning?.current ? 0 : scrollProgress.current;
    bikeGroupRef.current.visible = !transitioning?.current || scrollProgress.current >= FLIGHT_STOP;
    const bikeTravel = getBikeTravel(progress);
    const boatTravel = THREE.MathUtils.clamp((progress - .31) / .18, 0, 1);
    const bikeTime = t + Math.PI * .3, shipTime = t + Math.PI * .7;
    const wheelAngle = bikeTravel * Math.PI * -16;
    const pedalAngle = bikeTravel * Math.PI * 32;
    frontWheelRef.current.rotation.y = THREE.MathUtils.lerp(frontWheelRef.current.rotation.y, wheelAngle, alpha);
    backWheelRef.current.rotation.y = THREE.MathUtils.lerp(backWheelRef.current.rotation.y, wheelAngle, alpha);
    bikePedalHolderRef.current.rotation.y = THREE.MathUtils.lerp(bikePedalHolderRef.current.rotation.y, pedalAngle, alpha);
    bikePedalRef.current.rotation.y = THREE.MathUtils.lerp(bikePedalRef.current.rotation.y, -pedalAngle / 2, alpha);
    gearRef.current.rotation.y = THREE.MathUtils.lerp(gearRef.current.rotation.y, pedalAngle, alpha);
    bikeGroupRef.current.position.set(
      expandedVehicleOffset(-20.65, bikeTravel * 16.89 + Math.sin(bikeTime * 2.1 + .8) * .006),
      .15 + Math.sin(bikeTime * 2.3 + 1.5) * .016,
      Math.sin(bikeTime * 1.8 + 2.7) * .002 - .05,
    );
    bikeGroupRef.current.rotation.set(
      Math.sin(bikeTime * 1.9 + .4) * .001,
      Math.sin(bikeTime * 1.7 + 1.8) * .003,
      Math.sin(bikeTime * 1.5 + 2.9) * .001,
    );
    shipGroupRef.current.position.set(
      expandedVehicleOffset(-2.45, boatTravel * 10 + Math.sin(shipTime * .6 + 1.2) * .024),
      boatTravel * 1.5 + Math.sin(shipTime * .8 + .9) * .04,
      -.2 + Math.sin(shipTime * .5 + 1.8) * .004,
    );
    shipGroupRef.current.rotation.set(
      Math.sin(shipTime * .7 + 1.1) * .0025,
      Math.sin(shipTime * .4 + 2.3) * .005,
      Math.sin(shipTime * .6 + .6) * .00875,
    );
    sampleIntroWalk(progress, bikeSeatRef.current.position, offsets.walk);
    walkAnchorRef.current.position.set(offsets.walk.x, offsets.walk.y, offsets.walk.z);
    walkAnchorRef.current.rotation.z = offsets.walk.rock;
    if (riderAnchors) {
      riderAnchors.current.walkStart = walkAnchorRef.current;
      riderAnchors.current.bike = bikeSeatRef.current;
      riderAnchors.current.boat = boatDeckRef.current;
    }
  }, -3);

  return <group {...props} dispose={null}>
      <group ref={bikeGroupRef} position={[0, 0, -0.2]}>
        <object3D ref={bikeSeatRef} position={[-20.65, 1.08, -1.23]} />
        <object3D ref={walkAnchorRef} />
        <group
          ref={bikePedalHolderRef}
          position={[-20.535, 0.616, -1.381]}
          rotation={[-Math.PI / 2, 0, -Math.PI]}
        >
          <mesh
            geometry={nodes.Bike_Pedal_Holder.geometry}
            material={material}
          />
          <mesh
            ref={bikePedalRef}
            geometry={nodes.Bike_Pedal.geometry}
            material={material}
            position={[-0.138, 0.002, 0.005]}
            rotation={[0, 0, 0]}
          />
        </group>
        <mesh
          geometry={nodes.Bike_Stick.geometry}
          material={material}
          position={[-20.497, 0.378, -1.48]}
          rotation={[Math.PI, 0, Math.PI]}
          scale={[1.523, 1, 1.523]}
        />
        <mesh
          geometry={nodes.Bike_Body.geometry}
          material={material}
          position={[-20.607, 0.901, -1.391]}
          rotation={[-Math.PI / 2, 0, -Math.PI]}
        />
        <mesh
          ref={backWheelRef}
          geometry={nodes.Bike_Bake_Wheel.geometry}
          material={material}
          position={[-20.918, 0.666, -1.392]}
          rotation={[Math.PI / 2, -0.242, 0]}
        />
        <mesh
          ref={frontWheelRef}
          geometry={nodes.Bike_Front_Wheel.geometry}
          material={material}
          position={[-19.978, 0.664, -1.395]}
          rotation={[Math.PI / 2, -0.242, 0]}
        />
        <mesh
          ref={gearRef}
          geometry={nodes.Plane107.geometry}
          material={material}
          position={[-20.537, 0.615, -1.385]}
          rotation={[-Math.PI / 2, 0, -Math.PI]}
        />

      </group>

      <group position={[-0.2, 0, 0.2]} ref={shipGroupRef}>
        <object3D ref={boatDeckRef} position={[-2.45, 1.60, -1.40]} />
        <Canoe />
      </group>
  </group>;
}

useGLTF.preload("/models/Moving_Extras.glb");
