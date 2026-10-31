import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getCharacterOutfit } from "../utils/characterWardrobe";

const OUTFITS = [
  { name: "shanghai", layers: ["shanghai", "shanghai-sleeves"] },
  { name: "swim", layers: ["swim"] },
  { name: "hanoi", layers: ["hanoi", "hanoi-sleeves"] },
  { name: "quanho", layers: ["quanho", "quanho-sleeves", "quanho-hat"] },
  { name: "groom", layers: ["groom", "groom-sleeves"] },
];
const FILES = OUTFITS.flatMap(({ layers }) => layers);

export default function CharacterWardrobe({ scrollProgress, cameraScrollCurve }) {
  const groups = useRef({});
  const selected = useRef(null);
  // Decode every layer up front, so changing scenes never waits for a fetch.
  const textures = useTexture(FILES.map((name) => `/wardrobe/${name}.svg`));
  const maps = useMemo(() => Object.fromEntries(FILES.map((name, i) => {
    textures[i].colorSpace = THREE.SRGBColorSpace;
    return [name, textures[i]];
  })), [textures]);

  useFrame(() => {
    const outfit = getCharacterOutfit(
      scrollProgress.current,
      cameraScrollCurve.transitionCurveActive.current,
    );
    if (outfit === selected.current) return;
    selected.current = outfit;
    for (const { name } of OUTFITS) {
      if (groups.current[name]) groups.current[name].visible = name === outfit;
    }
  });

  return OUTFITS.map(({ name, layers }) => <group key={name}
    ref={(group) => { groups.current[name] = group; }} visible={false}>
    {layers.map((layer, index) => <mesh key={layer}
      position={[0, 0.3, [0.065, 0.125, 0.235][index]]}>
      <planeGeometry args={[4.4, 5.4]} />
      <meshBasicMaterial map={maps[layer]} transparent alphaTest={0.1}
        side={THREE.DoubleSide} toneMapped={false} />
    </mesh>)}
  </group>);
}
