import { useGLTF } from "../utils/gltfLoader";
import { useKTX2Texture } from "../utils/ktxLoader";
import { NotebookWall, PaperCutout, PaperStage } from "../components/PaperScenery";
import CrayonTitle from "../components/CrayonTitle";
import PhotoMemoryCutout from "../components/PhotoMemoryCutout";

export default function Model(props) {
  const { nodes } = useGLTF("/models/scene_2.glb");
  const background = useKTX2Texture("/textures/scene_2.ktx2");
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Plane049.geometry} material={background} position={[-20.599, 4.634, -2.755]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Plane058.geometry} material={background} position={[-20.599, 4.634, -2.755]} rotation={[Math.PI / 2, 0, 0]} />
      <NotebookWall position={[2.1, 4.634, -2.72]} size={[11.18, 8.06]} repeat={1.38} />
      <PaperStage source={nodes.Plane045.geometry} position={[-0.387, 1.016, -0.262]} rotation={[0, 0, 0.144]} />
      <PaperCutout asset="lanha-distant" position={[2.6, 3.35, -2.55]} size={[9.3, 3.93]} />
      <PaperCutout asset="lanha-karsts" position={[-0.45, 2.55, -2.32]} size={[4.9, 2.92]} />
      <PaperCutout asset="lanha-karsts" position={[4.35, 3.0, -2.30]} size={[5.0, 2.98]} tilt={-0.015} />
      <CrayonTitle text="Ha Long Bay" position={[2.3, 4.3, -2.1]} rotation={[0, 0, -0.02]} />
      <PhotoMemoryCutout asset="child-sun" position={[5.9, 4.05, -2.08]}
        size={[1.35, 1.35]} tilt={0.07}
        photo="/media/halong-memory.png"
        label="Ảnh kỷ niệm tại Hạ Long"
        alt="Ảnh kỷ niệm của chúng mình bên bàn ăn tại Hạ Long" />
      <PaperCutout asset="lanha-water" position={[-0.4, 1.1, -1.62]} size={[3.8, 0.86]} float floatAmplitude={0.025} phase={0.3} />
      <PaperCutout asset="lanha-water" position={[3.0, 1.55, -1.62]} size={[3.8, 0.86]} float floatAmplitude={0.03} phase={2.1} />
      <PaperCutout asset="lanha-water" position={[6.2, 2.0, -1.62]} size={[3.8, 0.86]} float floatAmplitude={0.025} phase={4.3} />
    </group>
  );
}
useGLTF.preload("/models/scene_2.glb");
