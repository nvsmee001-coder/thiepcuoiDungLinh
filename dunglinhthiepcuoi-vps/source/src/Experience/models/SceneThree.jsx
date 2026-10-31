import CrayonTitle from "../components/CrayonTitle";
import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "../utils/gltfLoader";
import { useKTX2Texture } from "../utils/ktxLoader";
import { PaperCutout, NotebookWall } from "../components/PaperScenery";

// Hanoi replaces only the former Egyptian/work-experience part of the loop.
// The original paper stage remains at y=2.177; food floats above the landmarks.
export default function Model(props) {
  const { nodes } = useGLTF("/models/scene_3.glb");
  const background = useKTX2Texture("/textures/scene_3.ktx2");
  const { floor, floorMaterial } = useMemo(() => {
    // Rebuild the paper-stage UVs so the former pyramid's baked shadow is gone.
    const floor = nodes.Plane115.geometry.clone();
    const position = floor.attributes.position, normal = floor.attributes.normal;
    const uv = [], colors = [];
    for (let i = 0; i < position.count; i++) {
      uv.push(position.getX(i) * 0.25, position.getZ(i) * 0.25);
      const shade = normal.getY(i) > 0.5 ? 1 : 0.82;
      colors.push(shade, shade, shade);
    }
    floor.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    floor.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ddc4a0"; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "#a3a27f"; ctx.lineWidth = 2;
    for (let x = 16; x < 512; x += 32) {
      ctx.beginPath();ctx.moveTo(x, 0);ctx.bezierCurveTo(x+2, 170, x-2, 340, x, 512);ctx.stroke();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    const floorMaterial = new THREE.MeshBasicMaterial({ map, vertexColors: true });
    return { floor, floorMaterial };
  }, [nodes]);
  return (
    <group {...props} dispose={null}>
      <mesh geometry={floor} material={floorMaterial} position={[10.712, 2.177, -0.262]} />
      <mesh geometry={nodes.Plane117.geometry} material={background} position={[-20.599, 4.634, -2.755]} rotation={[Math.PI / 2, 0, 0]} />
      <NotebookWall position={[11.2, 6.2, -2.72]} size={[7.25, 8.06]} repeat={0.9} />
      <CrayonTitle text="Hà Nội city" position={[9.6, 4.35, -1.9]} size={[3.0, .7]} rotation={[0, 0, -0.02]} />
      <PaperCutout asset="hanoi-turtle-tower" position={[12.55, 3.99, -2.24]} size={[2.8, 3.56]} />
      <PaperCutout asset="hanoi-the-huc" position={[9.3, 2.85, -2.20]} size={[3.1, 1.96]} tilt={-0.015} />
      <PaperCutout asset="hanoi-pho" position={[8.35, 5.35, -1.95]} size={[1.7, 1.44]} tilt={-0.10} float floatAmplitude={0.14} phase={0} />
      <PaperCutout asset="hanoi-banh-com" position={[9.95, 5.95, -2.08]} size={[1.45, 1.17]} tilt={0.12} float floatAmplitude={0.16} phase={1.8} />
      <PaperCutout asset="hanoi-banh-mi" position={[11.55, 6.05, -1.94]} size={[1.4, 1.21]} tilt={-0.13} float floatAmplitude={0.13} phase={3.2} />
      <PaperCutout asset="hanoi-egg-coffee" position={[14.05, 5.4, -2.08]} size={[1.35, 1.16]} tilt={0.09} float floatAmplitude={0.17} phase={4.7} />
    </group>
  );
}
useGLTF.preload("/models/scene_3.glb");
