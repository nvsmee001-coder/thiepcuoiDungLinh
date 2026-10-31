export const FIREWORKS_RANGE = { start: 0.105, end: 0.215 };
export const FIREWORKS_CAPACITY = 320;
const LAUNCHERS = [
  { x: -0.9, y: 3.55, targetX: -1.9, targetY: 4.35 },
  { x: 0.9, y: 3.55, targetX: 1.9, targetY: 4.45 },
  { x: 0, y: 4.35, targetX: 0.1, targetY: 4.95 },
];
export const FIREWORKS_COLORS = ["#e84e8c", "#d5a02a", "#8b63c5", "#269eae", "#df783e", "#6a9c57"];

export function createCastleFireworks() {
  return { particles: Array.from({ length: FIREWORKS_CAPACITY }, () => ({ alive: false })), cursor: 0, active: false, timer: 0, sequence: 0, seed: 8137, launches: 0, bursts: 0 };
}
function random(system) {
  system.seed = (system.seed * 1664525 + 1013904223) >>> 0;
  return system.seed / 4294967296;
}
function emit(system, particle) {
  Object.assign(system.particles[system.cursor], particle, { alive: true, age: 0 });
  system.cursor = (system.cursor + 1) % FIREWORKS_CAPACITY;
}
function burst(system, rocket, reducedMotion) {
  system.bursts++;
  const count = reducedMotion ? 24 : 64;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + random(system) * 0.08;
    const speed = (0.5 + random(system) * 0.4) * (reducedMotion ? 0.55 : 1);
    emit(system, { kind: "spark", x: rocket.targetX, y: rocket.targetY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.2 + random(system) * 0.3, width: 0.026 + random(system) * 0.015, length: 0.12 + random(system) * 0.07, color: (rocket.color + (i % 9 === 0 ? 1 : 0)) % FIREWORKS_COLORS.length });
  }
}

export function stepCastleFireworks(system, delta, { progress, transitioning = false, reducedMotion = false }) {
  const dt = Math.min(Math.max(delta, 0), 0.05);
  const active = !transitioning && progress >= FIREWORKS_RANGE.start && progress <= FIREWORKS_RANGE.end;
  if (active && !system.active) { system.timer = 0; system.sequence = 0; }
  system.active = active;
  const completed = [], trails = [];
  for (const p of system.particles) {
    if (!p.alive) continue;
    p.age += dt;
    if (p.age >= p.life) {
      p.alive = false;
      if (p.kind === "rocket") completed.push({ ...p });
      continue;
    }
    if (p.kind === "rocket") {
      const t = p.age / p.life;
      p.x = p.originX + (p.targetX - p.originX) * t;
      p.y = p.originY + (p.targetY - p.originY) * t;
      trails.push({ kind: "trail", x: p.x, y: p.y, vx: -p.vx * 0.06, vy: -0.12, life: 0.28, width: 0.013, length: 0.07, color: p.color });
    } else {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy -= (p.kind === "spark" ? 0.35 : 0.04) * dt;
      p.vx *= Math.exp(-0.35 * dt);
    }
  }
  for (const trail of trails) emit(system, trail);
  for (const rocket of completed) burst(system, rocket, reducedMotion);
  if (active) {
    system.timer -= dt;
    if (system.timer <= 0) {
      const origin = LAUNCHERS[system.sequence % LAUNCHERS.length];
      const life = reducedMotion ? 0.9 : 0.6;
      emit(system, { kind: "rocket", ...origin, originX: origin.x, originY: origin.y, vx: (origin.targetX - origin.x) / life, vy: (origin.targetY - origin.y) / life, life, width: 0.025, length: 0.1, color: system.sequence % FIREWORKS_COLORS.length });
      system.sequence++; system.launches++;
      system.timer = reducedMotion ? 2.4 : 0.85;
    }
  }
  return system;
}
