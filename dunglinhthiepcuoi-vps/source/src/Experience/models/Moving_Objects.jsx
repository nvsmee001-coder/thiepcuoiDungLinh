import { getBikeTravel, sampleIntroWalk, FLIGHT_STOP } from "../utils/flightLanding";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Canoe from "../components/Canoe";
import PorscheConvertible, { PORSCHE_SEAT } from "../components/PorscheConvertible";
import HanoiBicycle from "../components/HanoiBicycle";
import { boatTravelAt, boatMotionWeight } from "../utils/hanoiCycling";
import { expandedVehicleOffset } from "../utils/cityLayout";
import { animationDelta } from "../utils/frameTiming";

export default function Model({ scrollProgress, riderAnchors, transitioning, ...props }) {
  const bikeGroupRef = useRef(), bikeSeatRef = useRef(), boatDeckRef = useRef(), walkAnchorRef = useRef();
  const shipGroupRef = useRef();
  const offsets = useMemo(() => ({ time: 0, walk: {} }), []);

  useFrame((_, delta) => {
    offsets.time += animationDelta(delta);
    const t = offsets.time;
    const progress = transitioning?.current ? 0 : scrollProgress.current;
    bikeGroupRef.current.visible = !transitioning?.current || scrollProgress.current >= FLIGHT_STOP;
    const bikeTravel = getBikeTravel(progress);
    const boatTravel = boatTravelAt(progress), boatMotion = boatMotionWeight(progress);
    const bikeTime = t + Math.PI * .3, shipTime = t + Math.PI * .7;
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
      expandedVehicleOffset(-2.45, boatTravel * 10 + Math.sin(shipTime * .6 + 1.2) * .024 * boatMotion),
      boatTravel * 1.5 + Math.sin(shipTime * .8 + .9) * .04 * boatMotion,
      -.2 + Math.sin(shipTime * .5 + 1.8) * .004 * boatMotion,
    );
    shipGroupRef.current.rotation.set(
      Math.sin(shipTime * .7 + 1.1) * .0025 * boatMotion,
      Math.sin(shipTime * .4 + 2.3) * .005 * boatMotion,
      Math.sin(shipTime * .6 + .6) * .00875 * boatMotion,
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
        <object3D ref={bikeSeatRef} position={PORSCHE_SEAT} />
        <object3D ref={walkAnchorRef} />
        <PorscheConvertible scrollProgress={scrollProgress} transitioning={transitioning} />

      </group>

      <group position={[-0.2, 0, 0.2]} ref={shipGroupRef}>
        <object3D ref={boatDeckRef} position={[-2.45, 1.60, -1.40]} />
        <Canoe />
      </group>
      <HanoiBicycle scrollProgress={scrollProgress} transitioning={transitioning} riderAnchors={riderAnchors} />
  </group>;
}

