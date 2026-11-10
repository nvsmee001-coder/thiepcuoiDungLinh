import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DIVE_HIDDEN, DIVE_START, sampleSwimJourney } from "../utils/swimJourney";

const DROP_COUNT = 30;
const fraction = (value) => value - Math.floor(value);

function createDropTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const outline = new Path2D();
  outline.moveTo(65, 10);
  outline.bezierCurveTo(60, 30, 28, 58, 29, 82);
  outline.bezierCurveTo(30, 123, 100, 123, 101, 81);
  outline.bezierCurveTo(101, 57, 72, 29, 65, 10);
  context.fillStyle = "#9ddbe1";
  context.strokeStyle = "#528d9c";
  context.lineWidth = 5;
  context.lineJoin = "round";
  context.fill(outline);
  context.stroke(outline);
  context.save();
  context.clip(outline);
  // A few pale pencil flecks keep the drops in the scene's paper style.
  for (let i = 0; i < 96; i++) {
    const x = fraction(Math.sin(i * 3.7 + 1) * 43758.5) * 128;
    const y = fraction(Math.sin(i * 8.1 + 4) * 16341.7) * 128;
    context.fillStyle = i % 2 ? "#d9f0e66b" : "#5897a633";
    context.fillRect(x, y, 1.4, 2.5);
  }
  context.restore();
  context.strokeStyle = "#f2f6dd";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(46, 74);
  context.quadraticCurveTo(40, 88, 49, 96);
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Mount beside the rider, outside its visibility group. Positions are sampled
// from route progress, so fast seeking/reversing neither stacks emitters nor
// leaves water in the following venue card. The shared clock adds only flutter.
export default function DiveWaterDroplets({ riderRef, swimPose, scrollProgress, cameraScrollCurve }) {
  const mesh = useRef();
  const map = useMemo(createDropTexture, []);
  const drops = useMemo(() => Array.from({ length: DROP_COUNT }, (_, i) => {
    const seed = fraction(Math.sin(i * 12.9898 + 2) * 43758.5453);
    const alternate = i % 2 ? 1 : -1;
    return {
      birth: (i / DROP_COUNT) * .58,
      side: alternate * (.12 + seed * .2),
      vx: alternate * (.25 + seed * .65),
      vy: .55 + fraction(seed * 7.3) * .8,
      size: .085 + fraction(seed * 4.1) * .075,
      phase: seed * Math.PI * 2,
    };
  }), []);
  const scratch = useMemo(() => ({
    origin: new THREE.Vector3(),
    parentInverse: new THREE.Matrix4(),
    cameraRotation: new THREE.Quaternion(),
    parentRotation: new THREE.Quaternion(),
    transform: new THREE.Object3D(),
    birthPose: {},
  }), []);

  useEffect(() => () => map.dispose(), [map]);
  useLayoutEffect(() => { mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }, []);

  useFrame(({ scene, camera }) => {
    const progress = scrollProgress?.current;
    const span = DIVE_HIDDEN - DIVE_START;
    const t = (progress - DIVE_START) / span;
    const active = !cameraScrollCurve?.transitionCurveActive.current
      && riderRef?.current && swimPose?.current && t >= 0 && t < 1.04;
    mesh.current.visible = Boolean(active);
    if (!active) return;

    const { origin, parentInverse, cameraRotation, parentRotation, transform, birthPose } = scratch;
    const time = scene.userData.animationTime || 0;
    riderRef.current.updateWorldMatrix(true, false);
    riderRef.current.getWorldPosition(origin);
    // The actor descends, while the already emitted droplets retain their
    // own birth height and drift upwards/outwards from that fixed column.
    origin.y -= swimPose.current.yOffset;
    mesh.current.parent.updateWorldMatrix(true, false);
    parentInverse.copy(mesh.current.parent.matrixWorld).invert();
    camera.getWorldQuaternion(cameraRotation);
    mesh.current.parent.getWorldQuaternion(parentRotation).invert();
    cameraRotation.premultiply(parentRotation);

    for (let i = 0; i < DROP_COUNT; i++) {
      const drop = drops[i];
      const age = (t - drop.birth) / .46;
      if (age < 0 || age >= 1) {
        transform.scale.setScalar(0);
      } else {
        sampleSwimJourney(DIVE_START + span * drop.birth, false, 0, birthPose);
        const easeOut = 1 - (1 - age) ** 2;
        const fade = Math.sin(Math.PI * age) ** .45;
        transform.position.set(
          origin.x + drop.side + drop.vx * easeOut,
          origin.y + birthPose.yOffset + drop.vy * age - .55 * age * age,
          origin.z + .12,
        ).applyMatrix4(parentInverse);
        transform.quaternion.copy(cameraRotation);
        transform.rotateZ(-Math.atan2(drop.vx, drop.vy) + .08 * Math.sin(time * 4 + drop.phase));
        transform.scale.set(drop.size * fade, drop.size * 1.45 * fade, 1);
      }
      transform.updateMatrix();
      mesh.current.setMatrixAt(i, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, -1.5);

  return <instancedMesh ref={mesh} args={[null, null, DROP_COUNT]} visible={false}
    frustumCulled={false} renderOrder={5} raycast={() => null}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={map} transparent alphaTest={.035} depthWrite={false}
      side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
  </instancedMesh>;
}
