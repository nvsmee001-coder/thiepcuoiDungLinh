export const FLOWER_CAPACITY = 84;
export const HANOI_FLOWER_BOUNDS = { left: 7.65, right: 14.85, bottom: 2.15, top: 7.7 };

export function flowerOpacity(progress, transitioning = false) {
  if (transitioning || progress <= .475 || progress >= .615) return 0;
  return Math.min(1, (progress - .475) / .02, (.615 - progress) / .025) * .88;
}

export function createMilkFlowers(count = FLOWER_CAPACITY) {
  let seed = 281126;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const { left, right, bottom, top } = HANOI_FLOWER_BOUNDS;
  return Array.from({ length: count }, () => ({
    x: left + .3 + random() * (right - left - .6),
    y: bottom + random() * (top - bottom),
    z: -1.05 + random() * .55,
    speed: .17 + random() * .2,
    size: .07 + random() * .075,
    phase: random() * Math.PI * 2,
    spin: (random() - .5) * .45,
  }));
}

// Mutate one reusable sample; no objects are allocated in the animation loop.
export function sampleMilkFlower(flower, time, target, reducedMotion = false) {
  const { bottom, top } = HANOI_FLOWER_BOUNDS;
  const height = top - bottom;
  const elapsed = reducedMotion ? 0 : time;
  target.x = flower.x + Math.sin(elapsed * .45 + flower.phase) * .22;
  target.y = bottom + ((flower.y - bottom - elapsed * flower.speed) % height + height) % height;
  target.z = flower.z;
  target.rotation = flower.phase + elapsed * flower.spin;
  target.size = flower.size * (.8 + Math.sin(elapsed * .7 + flower.phase) * .2);
  return target;
}
