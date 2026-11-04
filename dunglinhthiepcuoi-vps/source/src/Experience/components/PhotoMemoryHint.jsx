import { useCityLayoutScale } from "./CityLayout";
import { useEffect, useState } from "react";
import * as THREE from "three";

export default function PhotoMemoryHint({ position, placement = "above", targetHeight }) {
  const cityScale = useCityLayoutScale();
  const [map, setMap] = useState(null);
  const below = placement === "below";

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 420;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#927a68";
    // A loose pencil curve points toward the trigger, with a clear arrowhead.
    ctx.lineWidth = 5;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.save();
    if (below) {
      ctx.translate(0, 420);
      ctx.scale(1, -1);
    }
    ctx.beginPath();
    ctx.moveTo(720, 120);
    ctx.bezierCurveTo(855, 125, 835, 300, 610, 393);
    ctx.moveTo(617, 350);
    ctx.lineTo(610, 393);
    ctx.lineTo(654, 390);
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(724, 124);
    ctx.bezierCurveTo(847, 134, 830, 302, 614, 390);
    ctx.stroke();
    ctx.restore();

    let seed = 137;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 6500; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.15 + random() * 0.45})`;
      ctx.fillRect(random() * 1024, random() * 420, 1 + random() * 2, 0.7);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    setMap(texture);
    return () => texture.dispose();
  }, [below]);

  if (!map) return null;
  return <group position={position} scale={[1 / cityScale, 1, 1]}>
    <mesh position={[0, (below ? -1 : 1) * (targetHeight / 2 + 0.28), 0.08]}
      renderOrder={3} raycast={() => null}>
      <planeGeometry args={[1.25, 0.513]} />
      <meshBasicMaterial map={map} transparent alphaTest={0.03} depthWrite={false}
        side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
    </mesh>
  </group>;
}
