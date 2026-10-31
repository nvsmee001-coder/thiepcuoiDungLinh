import CrayonTitle from "../components/CrayonTitle";
import { useGLTF } from "../utils/gltfLoader";
import { useKTX2Texture } from "../utils/ktxLoader";
import { NotebookWall, PaperCutout, PaperStage } from "../components/PaperScenery";

export default function Model(props) {
  const { nodes } = useGLTF("/models/scene_4.glb");
  const background = useKTX2Texture("/textures/scene_4.ktx2");
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Plane134.geometry} material={background} position={[-20.599, 4.634, -2.755]} rotation={[Math.PI / 2, 0, 0]} />
      <NotebookWall position={[18.3, 6.2, -2.72]} size={[7.4, 8.06]} repeat={0.92} />
      <PaperStage source={nodes.Plane133.geometry} position={[17.656, 2.177, -0.262]} baseColor="#c8cfac" lineColor="#a0ad8b" />
      <CrayonTitle text="Bắc Ninh city" position={[18.4, 6.7, -1.95]} size={[3.8, .89]} rotation={[0, 0, -0.02]} />
      <PaperCutout asset="bacninh-thuy-dinh" position={[18.55, 3.25, -2.38]} size={[3.6, 3.04]} />
      <PaperCutout asset="bacninh-lien-anh" position={[16.5, 3.45, -2.02]} size={[1.66, 2.51]} tilt={-0.018} float floatAmplitude={0.025} phase={1.5} />
      <PaperCutout asset="bacninh-lien-chi" position={[20.45, 3.45, -1.98]} size={[1.68, 2.57]} tilt={0.018} float floatAmplitude={0.025} phase={3.5} />
      <PaperCutout asset="bacninh-banh-da" position={[16.0, 5.3, -2.05]} size={[1.65, 1.53]} tilt={-0.10} float floatAmplitude={0.09} phase={0.5} />
      <PaperCutout asset="bacninh-my-chu" position={[18.4, 5.45, -2.05]} size={[1.4, 1.30]} tilt={0.09} float floatAmplitude={0.10} phase={2.5} />
      <PaperCutout asset="bacninh-vai-thieu" position={[20.8, 5.3, -2.05]} size={[1.65, 1.53]} tilt={-0.08} float floatAmplitude={0.09} phase={4.5} />
    </group>
  );
}
useGLTF.preload("/models/scene_4.glb");
