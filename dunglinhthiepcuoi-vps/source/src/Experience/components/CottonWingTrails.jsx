import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { smoothFlight, TOUCHDOWN } from "../utils/flightLanding";

const PUFFS_PER_WING = 16;
const PUFF_COUNT = PUFFS_PER_WING * 2;
const WINGS = [[.20, .32, -.07], [.12, -.43, .025]];
const fraction = (value) => value - Math.floor(value);

function createCottonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 160;
  const context = canvas.getContext("2d");
  const cotton = new Path2D();
  cotton.moveTo(31, 102);
  cotton.bezierCurveTo(9, 88, 18, 58, 39, 57);
  cotton.bezierCurveTo(33, 30, 63, 14, 81, 33);
  cotton.bezierCurveTo(100, 12, 129, 29, 125, 51);
  cotton.bezierCurveTo(150, 52, 157, 80, 138, 94);
  cotton.bezierCurveTo(151, 116, 126, 138, 105, 125);
  cotton.bezierCurveTo(90, 146, 64, 137, 58, 124);
  cotton.bezierCurveTo(39, 134, 20, 121, 31, 102);
  const fill = context.createRadialGradient(73, 68, 12, 81, 82, 73);
  fill.addColorStop(0, "#fffef5");
  fill.addColorStop(.66, "#f9f8ef");
  fill.addColorStop(1, "#e1e4dc");
  context.fillStyle = fill;
  context.strokeStyle = "#bfc9c1aa";
  context.lineWidth = 2.4;
  context.lineJoin = "round";
  context.shadowColor = "#fffef3";
  context.shadowBlur = 5;
  context.fill(cotton);
  context.shadowBlur = 0;
  context.stroke(cotton);
  context.save();
  context.clip(cotton);
  for (let i = 0; i < 110; i++) {
    const x = fraction(Math.sin(i * 8.13 + 2) * 16341.7) * 160;
    const y = fraction(Math.sin(i * 4.71 + 7) * 43758.5) * 160;
    context.fillStyle = i % 3 ? "#ffffff77" : "#bbc8bd33";
    context.fillRect(x, y, 1.7, 2.3);
  }
  context.restore();
  context.strokeStyle = "#d7dfd566";
  context.lineWidth = 2.1;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(39, 73);
  context.quadraticCurveTo(46, 60, 59, 68);
  context.moveTo(94, 105);
  context.quadraticCurveTo(111, 97, 119, 108);
  context.stroke();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

// Parent this to the aircraft rig: both emitters stay on their wing tips
// during ascent, banking, seeking, and landing instead of drifting off-screen.
export default function CottonWingTrails({ scrollProgress, cameraScrollCurve }) {
  const mesh = useRef();
  const map = useMemo(createCottonTexture, []);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const puffs = useMemo(() => Array.from({ length: PUFF_COUNT }, (_, i) => ({
    wing: Math.floor(i / PUFFS_PER_WING),
    index: i % PUFFS_PER_WING,
    phase: fraction(Math.sin(i * 12.9898 + 2) * 43758.5453) * Math.PI * 2,
  })), []);

  useEffect(() => () => map.dispose(), [map]);
  useLayoutEffect(() => { mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }, []);

  useFrame(({ scene }) => {
    const progress = scrollProgress?.current ?? 0;
    const flying = cameraScrollCurve?.transitionCurveActive.current;
    const fade = 1 - smoothFlight((progress - .84) / (TOUCHDOWN - .84));
    mesh.current.visible = Boolean(flying && progress < TOUCHDOWN && fade > 0);
    if (!mesh.current.visible) return;

    const time = scene.userData.animationTime || 0;
    mesh.current.material.opacity = .83 * fade;
    for (let i = 0; i < PUFF_COUNT; i++) {
      const puff = puffs[i];
      const origin = WINGS[puff.wing];
      // An anchored small puff closes the seam. The rest gently roll away
      // behind and below the two wings, opening into a soft cotton plume.
      const age = puff.index === 0 ? 0
        : (puff.index - 1 + fraction(time * .7 + puff.wing * .41)) / (PUFFS_PER_WING - 1);
      const taper = puff.index === 0 ? 1 : Math.min(1, age * 8 + .3) * (1 - age) ** .55;
      const size = puff.index === 0 ? .18 : (.17 + .34 * age) * taper;
      transform.position.set(
        origin[0] - .035 - 1.72 * age,
        origin[1] - .035 - .47 * age + .045 * Math.sin(time * 1.4 + puff.phase) * age,
        origin[2] - .005 * age,
      );
      transform.rotation.set(0, 0, puff.phase + .09 * Math.sin(time + puff.phase));
      transform.scale.set(size * (1 + age * .45), size, 1);
      transform.updateMatrix();
      mesh.current.setMatrixAt(i, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, -2.25);

  return <instancedMesh ref={mesh} args={[null, null, PUFF_COUNT]} visible={false}
    frustumCulled={false} renderOrder={0} raycast={() => null}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={map} transparent alphaTest={.025} depthWrite={false}
      side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
  </instancedMesh>;
}
