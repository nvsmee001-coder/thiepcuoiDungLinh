import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// Included only in explicitly instrumented QA builds; no player-facing HUD.
export default function PerformanceProbe() {
  const scene = useThree((state) => state.scene);
  const sample = useMemo(() => ({ times: new Float64Array(240), count: 0, cursor: 0, elapsed: 0, calls: 0, triangles: 0, phase: "bike" }), []);
  useEffect(() => {
    const previous = scene.onAfterRender;
    const capture = (renderer, ...args) => {
      previous.call(scene, renderer, ...args);
      sample.calls = renderer.info.render.drawCalls ?? renderer.info.render.calls;
      sample.triangles = renderer.info.render.triangles;
    };
    scene.onAfterRender = capture;
    return () => { if (scene.onAfterRender === capture) scene.onAfterRender = previous; };
  }, [scene, sample]);
  useFrame(({ gl }, delta) => {
    if (delta <= 0 || delta > .25 || document.hidden) return;
    const progress = Number(gl.domElement.dataset.journeyProgress || 0);
    const phase = progress <= .3 ? "bike" : progress <= .49 ? "boat" : progress <= .6 ? "hanoi" : progress <= .72 ? "bacninh" : "final";
    if (phase !== sample.phase) {
      sample.phase = phase; sample.count = 0; sample.cursor = 0; sample.elapsed = 0;
    }
    sample.times[sample.cursor] = delta * 1000;
    sample.cursor = (sample.cursor + 1) % sample.times.length;
    sample.count = Math.min(sample.count + 1, sample.times.length);
    sample.elapsed += delta;
    if (sample.elapsed < .5) return;
    sample.elapsed = 0;
    gl.domElement.dataset.performanceWindow = sample.count >= 120 ? phase : "warming";
    const times = Array.from(sample.times.subarray(0, sample.count)).sort((a, b) => a - b);
    gl.domElement.dataset.performance = JSON.stringify({
      phase,
      samples: sample.count,
      fps: +(1000 / (times.reduce((sum, time) => sum + time, 0) / times.length)).toFixed(1),
      p95ms: +times[Math.floor((times.length - 1) * .95)].toFixed(2),
      over25ms: times.filter((time) => time > 25).length,
      calls: sample.calls,
      triangles: sample.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      dpr: gl.getPixelRatio(),
      buffer: [gl.domElement.width, gl.domElement.height],
    });
  }, -6);
  return null;
}
