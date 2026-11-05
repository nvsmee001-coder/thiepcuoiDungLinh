import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import PhotoMemoryCutout from "./PhotoMemoryCutout";
import { initialPandaPoints, SHIFT_X_AMOUNT } from "./curve";
import { RIDER_SCALE, RIDER_CONTACT_Y } from "../utils/riderAttachment";
import { FLIGHT_STOP, JUMP_END, flightDestinationX, sampleLoopFlight, sampleTouchdown, sampleBikeJump, smoothFlight } from "../utils/flightLanding";

export default function FlightTransport({ scrollProgress, cameraScrollCurve, riderAnchors, sceneGroupRef }) {
  const rig = useRef(), seat = useRef(), jumpAnchor = useRef(), gear = useRef();
  const wasVisible = useRef(false), parkedLoop = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [flightPhotoOpen, setFlightPhotoOpen] = useState(false);
  const flightPhotoOpenRef = useRef(false);
  const scratch = useMemo(() => ({
    start: new THREE.Vector3(), cruiseEnd: new THREE.Vector3(),
    landEnd: new THREE.Vector3(), bike: new THREE.Vector3(),
    position: new THREE.Vector3(), rotation: new THREE.Quaternion(),
    jump: new THREE.Vector3(), bank: new THREE.Quaternion(), axis: new THREE.Vector3(0, 0, 1),
  }), []);

  useFrame(() => {
    const flying = cameraScrollCurve.transitionCurveActive.current;
    const progress = scrollProgress.current, loop = cameraScrollCurve.loopCounter.current;
    // Leave the landed aircraft beside the bicycle until it is behind the
    // camera. It never appears in the first visit's walking introduction.
    const parked = !flying && parkedLoop.current === loop - 1 && progress <= .13;
    const visible = flying || parked;
    if (visible !== wasVisible.current) { wasVisible.current = visible; setEnabled(visible); }
    rig.current.visible = visible;
    riderAnchors.current.plane = seat.current;
    riderAnchors.current.jump = jumpAnchor.current;

    // Tự động mở ảnh cưới máy bay khi đang bay trên trời (0.10 -> 0.78), tự đóng khi hạ cánh
    const shouldShowPhoto = flying && progress >= 0.10 && progress <= 0.78;
    if (shouldShowPhoto !== flightPhotoOpenRef.current) {
      flightPhotoOpenRef.current = shouldShowPhoto;
      setFlightPhotoOpen(shouldShowPhoto);
    }

    if (!flying || !riderAnchors.current.walkStart || !riderAnchors.current.bike) return;
    const walk = riderAnchors.current.walkStart, bike = riderAnchors.current.bike;
    walk.getWorldPosition(scratch.cruiseEnd);
    bike.getWorldPosition(scratch.bike);
    bike.getWorldQuaternion(scratch.rotation);
    // Resolve destinations in the next copy of the world, independently of
    // the scenery swap at mid-flight. Both directions use the same path.
    const sceneryX = sceneGroupRef.current.position.x;
    scratch.cruiseEnd.x = flightDestinationX(scratch.cruiseEnd.x, sceneryX, loop, SHIFT_X_AMOUNT) - 2.2;
    scratch.cruiseEnd.y += 2.4;
    scratch.bike.x = flightDestinationX(scratch.bike.x, sceneryX, loop, SHIFT_X_AMOUNT);
    scratch.landEnd.copy(scratch.bike);
    scratch.landEnd.x -= 2.8;
    scratch.landEnd.y += .05;
    const last = initialPandaPoints.at(-1);
    scratch.start.set(last.x + SHIFT_X_AMOUNT * (loop - 1), last.y + 6.15845 + RIDER_CONTACT_Y.plane * RIDER_SCALE, last.z);

    if (progress < FLIGHT_STOP) {
      const t = progress / FLIGHT_STOP;
      sampleLoopFlight(t, scratch.start, scratch.cruiseEnd, scratch.position);
      rig.current.quaternion.identity().slerp(scratch.rotation, smoothFlight(t));
      gear.current.visible = false;
    } else {
      sampleTouchdown(progress, scratch.cruiseEnd, scratch.landEnd, scratch.position);
      scratch.bank.setFromAxisAngle(scratch.axis, scratch.position.bank);
      rig.current.quaternion.copy(scratch.rotation).multiply(scratch.bank);
      gear.current.visible = true;
      gear.current.scale.y = scratch.position.gear;
      // A separate world anchor lets the rider jump while the plane stays put.
      sampleBikeJump(progress, scratch.landEnd, scratch.bike, scratch.jump);
      jumpAnchor.current.position.copy(scratch.jump);
      scratch.bank.setFromAxisAngle(scratch.axis, scratch.jump.bank);
      jumpAnchor.current.quaternion.copy(scratch.rotation).multiply(scratch.bank);
      if (progress >= JUMP_END) parkedLoop.current = loop;
    }
    rig.current.position.copy(scratch.position);
  }, -2.5);

  return <group>
    <object3D ref={jumpAnchor} />
    <group ref={rig} visible={false}>
    <object3D ref={seat} />
    <group ref={gear} visible={false}>
      {[-.55, .72].map((x) => <group key={x} position={[x, 0, -.035]}>
        <mesh position={[0, -.46, 0]}>
          <planeGeometry args={[.025, .30]} />
          <meshBasicMaterial color="#69644e" side={THREE.DoubleSide} forceSinglePass />
        </mesh>
        <mesh position={[0, -.60, .002]}>
          <circleGeometry args={[.08, 14]} />
          <meshBasicMaterial color="#565856" side={THREE.DoubleSide} forceSinglePass />
        </mesh>
        <mesh position={[0, -.60, .004]}>
          <circleGeometry args={[.035, 12]} />
          <meshBasicMaterial color="#e7d9b7" side={THREE.DoubleSide} forceSinglePass />
        </mesh>
      </group>)}
    </group>
    <PhotoMemoryCutout enabled={enabled} forceOpen={flightPhotoOpen} asset="crayon-airplane" position={[.05, -.025, -.045]}
      size={[2.75, 1.27]} popupSide="right" hintPlacement="below"
      photo="/media/airline-wedding.jpg" label="Ảnh cưới của chúng mình"
      alt="Ảnh cưới của chúng mình dưới mái vòm lúc hoàng hôn" />
    </group>
  </group>;
}
