import CastleFireworks from "./CastleFireworks";
import { PaperCutout, NotebookWall } from "./PaperScenery";
import ShanghaiBalloon from "./ShanghaiBalloon";
import CrayonTitle from "./CrayonTitle";
import PhotoMemoryCutout from "./PhotoMemoryCutout";

export default function ShanghaiScenery({ scrollProgress, transitioning }) {
  return (
    <>
      <NotebookWall />
      <CastleFireworks scrollProgress={scrollProgress} transitioning={transitioning} />
      <PhotoMemoryCutout asset="crayon-airplane" position={[-20.3, 3.0, -2.15]}
        size={[2.75, 1.27]} tilt={0.06} float
        popupSide="right"
        hintPlacement="below"
        photo="/media/airline-wedding.jpg"
        label="Ảnh cưới của chúng mình"
        alt="Ảnh cưới của chúng mình dưới mái vòm lúc hoàng hôn" />
      <CrayonTitle text="ShangHai" position={[-8.9, 4.6, -2.2]} rotation={[0, 0, -.025]} />
      <PaperCutout asset="enchanted-castle" position={[-12.35, 2.92, -2.30]} size={[3.45, 4.64]} />
      <PaperCutout asset="zootopia" position={[-8.55, 1.95, -2.28]} size={[3.6, 2.64]} tilt={-0.018} />
      <PaperCutout asset="ferris-wheel" position={[-4.6, 2.5, -2.26]} size={[3.5, 3.79]} tilt={0.015} />
      <PaperCutout asset="mickey-garden" position={[-15.0, 1.13, -1.95]} size={[0.96, 1.05]} tilt={-0.02} />
      <PaperCutout asset="mickey-garden" position={[-10.55, 1.12, -1.92]} size={[0.96, 1.05]} tilt={0.025} />
      <ShanghaiBalloon position={[-6.55, 4.1, -2.25]} size={[1.0, 1.22]} tilt={-0.08} />
    </>
  );
}
