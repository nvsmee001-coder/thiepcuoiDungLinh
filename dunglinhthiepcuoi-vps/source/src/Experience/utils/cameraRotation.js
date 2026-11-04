import * as THREE from "three";

export function createRotationSampler(targets) {
  const quaternions = targets.map(({ rotation }) => new THREE.Quaternion().setFromEuler(rotation));
  return (progress, transitioning, output) => {
    if (transitioning) return output.slerpQuaternions(quaternions.at(-1), quaternions[0], progress);
    for (let i = 0; i < targets.length - 1; i++) {
      const start = targets[i], end = targets[i + 1];
      if (progress >= start.progress && progress <= end.progress) {
        return output.slerpQuaternions(quaternions[i], quaternions[i + 1], (progress - start.progress) / (end.progress - start.progress));
      }
    }
    return output.copy(quaternions.at(-1));
  };
}
