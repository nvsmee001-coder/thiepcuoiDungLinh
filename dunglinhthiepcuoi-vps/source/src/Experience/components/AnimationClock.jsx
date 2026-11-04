import { useFrame } from "@react-three/fiber";
import { animationDelta } from "../utils/frameTiming";

export default function AnimationClock() {
  useFrame(({ scene }, delta) => {
    scene.userData.animationTime = (scene.userData.animationTime || 0) + animationDelta(delta);
  }, -7);
  return null;
}
