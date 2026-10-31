import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function PaperCutout({ asset, position, size, tilt = 0, float = false, floatAmplitude = 0.045, phase = 0, ...interactionProps }) {
  const map = useTexture(`/scenery/${asset}.svg`);
  const group = useRef();
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace; }, [map]);
  useFrame(({ clock }) => {
    if (float && group.current) {
      group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.7 + phase) * floatAmplitude;
      group.current.rotation.z = tilt + Math.sin(clock.elapsedTime * 0.5 + phase) * 0.035;
    }
  });
  return (
    <group ref={group} position={position} rotation={[0, 0, tilt]}>
      <mesh position={[0.07, -0.05, -0.04]} renderOrder={1}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={map} color="#606b78" transparent opacity={0.17} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh renderOrder={2} {...interactionProps}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={map} transparent alphaTest={0.06} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function NotebookWall({ position = [-13.6, 4.635, -2.72], size = [21, 8.06], repeat = 2.6 }) {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e6e3d9"; ctx.fillRect(0, 0, 1024, 1024);
    let seed = 421;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 34000; i++) {
      ctx.fillStyle = random() > 0.5 ? "rgba(119,104,80,.045)" : "rgba(255,255,249,.14)";
      ctx.fillRect(random() * 1024, random() * 1024, 1 + random() * 2, 1);
    }
    ctx.lineWidth = 1.8;
    for (let y = 35; y < 1024; y += 52) {
      ctx.strokeStyle = "rgba(111,154,179,.46)"; ctx.beginPath();
      ctx.moveTo(0, y); ctx.bezierCurveTo(290, y - 1.5, 670, y + 2, 1024, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(196,118,108,.54)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(300, 0); ctx.bezierCurveTo(302, 300, 297, 700, 300, 1024); ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping; texture.repeat.x = repeat;
    return texture;
  }, [repeat]);
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}


export function PaperStage({ source, position, rotation, baseColor = "#a5c9c2", lineColor = "#82aaa5" }) {
  const { geometry, material } = useMemo(() => {
    const geometry = source.clone();
    const vertices = geometry.attributes.position, normals = geometry.attributes.normal;
    const coords = [], colors = [];
    for (let i = 0; i < vertices.count; i++) {
      coords.push(vertices.getX(i) * 0.25, vertices.getZ(i) * 0.25);
      const shade = normals.getY(i) > 0.5 ? 1 : 0.84;
      colors.push(shade, shade, shade);
    }
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(coords, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = baseColor; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = lineColor; ctx.lineWidth = 1.5;
    for (let x = 16; x < 512; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 2, 170, x - 2, 340, x, 512); ctx.stroke();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    return { geometry, material: new THREE.MeshBasicMaterial({ map, vertexColors: true }) };
  }, [source, baseColor, lineColor]);
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} />;
}
