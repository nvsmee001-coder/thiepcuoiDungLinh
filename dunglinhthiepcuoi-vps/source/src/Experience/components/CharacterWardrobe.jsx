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

export default function CharacterWardrobe({ scrollProgress, cameraScrollCurve, swimPose }) {
  const groups = useRef({});
  const selected = useRef({ outfit: null, swimming: false });
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
    const swimming = (swimPose?.current.swimWeight || 0) > .02;
    if (outfit === selected.current.outfit && swimming === selected.current.swimming) return;
    selected.current.outfit = outfit;
    selected.current.swimming = swimming;
    for (const { name, layers } of OUTFITS) {
      const group = groups.current[name];
      if (!group) continue;
      group.visible = name === outfit;
      // The moving blue flippers remain free while the torso keeps its outfit.
      for (let i = 0; i < layers.length; i++) group.children[i].visible = !swimming || !layers[i].endsWith("-sleeves");
    }
  });

  return OUTFITS.map(({ name, layers }) => <group key={name}
    ref={(group) => { groups.current[name] = group; }} visible={false}>
    {layers.map((layer, index) => <mesh key={layer}
      position={[0, 0.3, [0.065, 0.125, 0.235][index]]}>
      <planeGeometry args={[4.4, 5.4]} />
      <meshBasicMaterial map={maps[layer]} transparent alphaTest={0.1}
        side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
    </mesh>)}
  </group>);
}
