import PhotoMemoryCutout from "./PhotoMemoryCutout";

export default function ShanghaiBalloon(props) {
  return <PhotoMemoryCutout {...props} asset="mickey-balloons" float
    photo="/media/shanghai-memory.png"
    label="Ảnh kỷ niệm tại Shanghai Disneyland"
    alt="Kỷ niệm của chúng mình dưới pháo hoa ở Shanghai Disneyland" />;
}
