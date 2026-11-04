import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { isPhoneViewport } from "../utils/mobileCharacterLayout";
import { createQualityState, updateQuality } from "../utils/frameTiming";

export default function RenderQuality() {
  const { size, viewport, setDpr } = useThree();
  const maxDpr = Math.max(1, Math.min(viewport.initialDpr, isPhoneViewport(size.width, size.height) ? 1.5 : 2));
  const quality = useMemo(() => createQualityState(maxDpr), [maxDpr]);
  useFrame((_, delta) => {
    const dpr = updateQuality(quality, delta);
    if (viewport.dpr !== dpr) setDpr(dpr);
  }, -5);
  return null;
}
