// Match the original 60 Hz feel at 30/60/120 Hz; cap the first frame after sleep.
export const animationDelta = (delta) => Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), .05);
export const frameAlpha = (alphaAt60Hz, delta) => -Math.expm1(Math.log1p(-alphaAt60Hz) * animationDelta(delta) * 60);

export function createQualityState(maxDpr) {
  return { maxDpr, dpr: maxDpr, elapsed: 0, frames: 0, slowFrames: 0, stable: 0, cooldown: 4 };
}

export function updateQuality(state, delta) {
  if (!Number.isFinite(delta) || delta <= 0 || delta > .25) return state.dpr;
  state.cooldown = Math.max(0, state.cooldown - delta);
  state.elapsed += delta;
  state.frames++;
  if (delta > .022) state.slowFrames++;
  if (state.elapsed < 1) return state.dpr;
  const slowRatio = state.slowFrames / state.frames;
  const fps = state.frames / state.elapsed;
  state.stable = slowRatio < .02 && fps > 57 ? state.stable + state.elapsed : 0;
  if (state.cooldown === 0) {
    if (fps < 50 && slowRatio > .15 && state.dpr > 1) {
      state.dpr = Math.max(1, state.dpr - .25);
      state.cooldown = 5;
      state.stable = 0;
    } else if (state.stable > 10 && state.dpr < state.maxDpr) {
      state.dpr = Math.min(state.maxDpr, state.dpr + .25);
      state.cooldown = 8;
      state.stable = 0;
    }
  }
  state.elapsed = 0; state.frames = 0; state.slowFrames = 0;
  return state.dpr;
}
