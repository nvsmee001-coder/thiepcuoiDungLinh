import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useCityLayoutScale } from "./CityLayout";

export default function OriginalPaperSun({ source, material, size = 1.35, tilt = .07 }) {
  const cityScale = useCityLayoutScale();
  const sun = useMemo(() => {
    // Reuse the original sun and its atlas UVs; leave the cached GLB untouched.
    const geometry = source.clone();
    geometry.rotateX(Math.PI / 2);
    geometry.center();
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox.getSize(new THREE.Vector3());
    const scale = size / Math.max(bounds.x, bounds.y);
    geometry.scale(scale, scale, scale);
    const face = material.clone();
    face.side = THREE.DoubleSide;
    face.forceSinglePass = true;
    face.toneMapped = false;
    const shadow = face.clone();
    shadow.color.set("#606b78");
    shadow.opacity = .17;
    shadow.alphaTest = .01;
    shadow.depthWrite = false;
    return { geometry, face, shadow };
  }, [source, material, size]);
  useEffect(() => () => {
    sun.geometry.dispose();
    sun.face.dispose();
    sun.shadow.dispose();
  }, [sun]);

  return <group scale={[1 / cityScale, 1, 1]}><group rotation={[0, 0, tilt]}>
    <mesh geometry={sun.geometry} material={sun.shadow} position={[.07, -.05, -.04]} renderOrder={1} />
    <mesh geometry={sun.geometry} material={sun.face} renderOrder={2} />
  </group></group>;
}
