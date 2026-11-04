import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export default function RendererWarmup({ onReady }) {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    let cancelled = false;
    const states = [];
    // Compile all destinations and outfit materials under the loading cover.
    // compileAsync collects its render list synchronously before awaiting pipelines.
    scene.updateMatrixWorld(true);
    scene.traverse((object) => {
      states.push([object, object.visible, object.frustumCulled]);
      object.visible = true;
      object.frustumCulled = false;
    });
    let compilation;
    try { compilation = gl.compileAsync(scene, camera); }
    catch (error) { compilation = Promise.reject(error); }
    finally {
      for (const [object, visible, culled] of states) {
        object.visible = visible;
        object.frustumCulled = culled;
      }
    }
    Promise.resolve(compilation).catch((error) => console.warn("Scene warmup:", error)).finally(() => {
      if (!cancelled) { onReady(); invalidate(); }
    });
    return () => { cancelled = true; };
  }, [gl, scene, camera, onReady, invalidate]);
  return null;
}
