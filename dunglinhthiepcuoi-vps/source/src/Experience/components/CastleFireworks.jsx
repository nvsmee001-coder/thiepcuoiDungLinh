import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createCastleFireworks, stepCastleFireworks, FIREWORKS_CAPACITY, FIREWORKS_COLORS } from "../utils/castleFireworksSystem";

export default function CastleFireworks({ scrollProgress, transitioning }) {
  const mesh = useRef();
  const state = useMemo(() => createCastleFireworks(), []);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => FIREWORKS_COLORS.map((hex) => new THREE.Color(hex)), []);
  const paper = useMemo(() => new THREE.Color("#e6e3d9"), []);
  const ink = useMemo(() => new THREE.Color(), []);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    for (let i = 0; i < FIREWORKS_CAPACITY; i++) mesh.current.setColorAt(i, colors[0]);
    mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // WebGPU synchronizes this attribute through its version counter.
    mesh.current.instanceColor.setUsage(THREE.StaticDrawUsage);
    mesh.current.material.needsUpdate = true;
  }, [colors]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    stepCastleFireworks(state, delta, { progress: scrollProgress.current, transitioning: transitioning.current, reducedMotion });
    if (!state.active && !state.particles.some((p) => p.alive)) {
      mesh.current.visible = false;
      return;
    }
    let visible = false;
    state.particles.forEach((p, i) => {
      if (p.alive) {
        visible = true;
        const fade = Math.pow(Math.max(0, 1 - p.age / p.life), 0.5);
        transform.position.set(p.x, p.y, 0);
        transform.rotation.set(0, 0, Math.atan2(p.vy, p.vx) - Math.PI / 2);
        transform.scale.set(p.width * fade, p.length * fade, 1);
        ink.copy(colors[p.color]).lerp(paper, (1 - fade) * 0.35);
        mesh.current.setColorAt(i, ink);
      } else {
        transform.scale.set(0, 0, 0);
      }
      transform.updateMatrix();
      mesh.current.setMatrixAt(i, transform.matrix);
    });
    mesh.current.visible = visible;
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, FIREWORKS_CAPACITY]} position={[-12.35, 0, -2.12]} frustumCulled={false} visible={false} renderOrder={3}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial vertexColors transparent opacity={0.95} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
