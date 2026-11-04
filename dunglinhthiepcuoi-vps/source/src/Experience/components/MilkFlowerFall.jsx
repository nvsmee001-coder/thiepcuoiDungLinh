import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCityLayoutScale } from "./CityLayout";
import { createMilkFlowers, flowerOpacity, sampleMilkFlower, FLOWER_CAPACITY } from "../utils/milkFlowerSystem";
import { isPhoneViewport } from "../utils/mobileCharacterLayout";

export default function MilkFlowerFall({ scrollProgress, transitioning }) {
  const mesh = useRef();
  const cityScale = useCityLayoutScale();
  const viewport = useThree((state) => state.size);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const count = reducedMotion ? 20 : isPhoneViewport(viewport.width, viewport.height) ? 48 : FLOWER_CAPACITY;
  const flowers = useMemo(() => createMilkFlowers(), []);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const sample = useMemo(() => ({}), []);
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.translate(64, 64);
    ctx.strokeStyle = "#c0bc8b";
    ctx.lineWidth = 1.8;
    // Small ivory flowers with a pencil edge match the paper scenery.
    for (let petal = 0; petal < 5; petal++) {
      ctx.save(); ctx.rotate(petal * Math.PI * 2 / 5);
      ctx.beginPath(); ctx.ellipse(0, -22, 13, 25, -.12, 0, Math.PI * 2);
      ctx.fillStyle = petal % 2 ? "#fff9df" : "#f6efd0";
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#b8be83"; ctx.fill();
    ctx.fillStyle = "#e4ca87";
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 5, Math.sin(a) * 5, 2, 0, Math.PI * 2); ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  useLayoutEffect(() => { mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }, []);

  useFrame(({ scene }) => {
    const opacity = flowerOpacity(scrollProgress.current, transitioning?.current);
    mesh.current.visible = opacity > 0;
    if (!opacity) return;
    mesh.current.count = count;
    mesh.current.material.opacity = opacity;
    for (let i = 0; i < count; i++) {
      sampleMilkFlower(flowers[i], scene.userData.animationTime || 0, sample, reducedMotion);
      transform.position.set(sample.x, sample.y, sample.z);
      transform.rotation.set(0, 0, sample.rotation);
      transform.scale.setScalar(sample.size);
      transform.updateMatrix();
      // Cancel the stage's horizontal scale after translating the flower center.
      const elements = transform.matrix.elements;
      elements[0] /= cityScale;
      elements[4] /= cityScale;
      mesh.current.setMatrixAt(i, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[null, null, FLOWER_CAPACITY]} visible={false}
    frustumCulled={false} renderOrder={4} raycast={() => null}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={map} transparent alphaTest={.04} depthWrite={false}
      side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
  </instancedMesh>;
}
