import { useRef } from "react";
import { useGLTF } from "../utils/gltfLoader";
import { useKTX2Texture } from "../utils/ktxLoader";
import { useFrame } from "@react-three/fiber";
import WeddingText from "../components/WeddingText";
import ShanghaiScenery from "../components/ShanghaiScenery";

export default function Model({ scrollProgress, transitioning, ...props }) {
  const { nodes } = useGLTF("/models/scene_1.glb");
  const scene_1 = useKTX2Texture("/textures/scene_1.ktx2");
  const background = useKTX2Texture("/textures/scene_1_bg.ktx2");
  const grass1 = useRef();
  const grass2 = useRef();
  const grass3 = useRef();
  const grass4 = useRef();
  const grass5 = useRef();
  const grass6 = useRef();
  const grass7 = useRef();
  const grass8 = useRef();
  const grass9 = useRef();
  const grass10 = useRef();
  const grass11 = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const grass = [grass1,grass2,grass3,grass4,grass5,grass6,grass7,grass8,grass9,grass10,grass11];
    grass.forEach((ref, i) => {
      if (ref.current) ref.current.scale.z = 0.9 + 0.1 * Math.sin(t * (2.9 + i * 0.017));
    });
  });
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes["First_Scene_-_Bg"].geometry} material={background} position={[-21.188, 0.605, -0.262]} />
      <mesh geometry={nodes["First_Scene_-_Bg001"].geometry} material={background} position={[-21.188, 0.605, -0.262]} />
      <ShanghaiScenery scrollProgress={scrollProgress} transitioning={transitioning} />
      <mesh
        ref={grass11}
        geometry={nodes.Plane019.geometry}
        material={scene_1}
        position={[-7.18, 0.6, -0.032]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass10}
        geometry={nodes.Plane021.geometry}
        material={scene_1}
        position={[-8.939, 0.6, -0.632]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass1}
        geometry={nodes.Plane035.geometry}
        material={scene_1}
        position={[-10.407, 0.6, -0.18]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass9}
        geometry={nodes.Plane044.geometry}
        material={scene_1}
        position={[-5.758, 0.567, -0.294]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass8}
        geometry={nodes.Plane051.geometry}
        material={scene_1}
        position={[-16.072, 0.543, -0.242]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass2}
        geometry={nodes.Plane067.geometry}
        material={scene_1}
        position={[-17.956, 0.6, -0.18]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass7}
        geometry={nodes.Plane097.geometry}
        material={scene_1}
        position={[-14.164, 0.565, -2.277]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass3}
        geometry={nodes.Plane098.geometry}
        material={scene_1}
        position={[-18.584, 0.576, -2.295]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        geometry={nodes.Plane099.geometry}
        material={scene_1}
        position={[-12.503, 0.574, -2.199]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass6}
        geometry={nodes.Plane100.geometry}
        material={scene_1}
        position={[-14.476, 0.585, -0.393]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass5}
        geometry={nodes.Plane101.geometry}
        material={scene_1}
        position={[-16.49, 0.655, -1.962]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <mesh
        ref={grass4}
        geometry={nodes.Plane102.geometry}
        material={scene_1}
        position={[-5.192, 0.585, -0.816]}
        rotation={[Math.PI / 2, -0.102, 0]}
      />
      <group position={[-17.941, 2.096, -2.68]} rotation={[0, 0, 0.025]}>
        <WeddingText kind="welcome" />
      </group>
      <group position={[-15.7, 1.987, -2.68]} rotation={[0, 0, 0.025]}>
        <WeddingText kind="story" />
      </group>
    </group>
  );
}
useGLTF.preload("/models/scene_1.glb");
