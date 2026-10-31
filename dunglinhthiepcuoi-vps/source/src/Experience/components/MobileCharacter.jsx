import { useEffect, useState } from "react";
import { useMobileCharacterStore } from "../utils/mobileCharacterStore";
import { isPhoneViewport, mobileCharacterLayout } from "../utils/mobileCharacterLayout";
import "./MobileCharacter.scss";

const layers = {
  shanghai: ["shanghai", "shanghai-sleeves"],
  swim: ["swim"],
  hanoi: ["hanoi", "hanoi-sleeves"],
  quanho: ["quanho", "quanho-sleeves", "quanho-hat"],
  groom: ["groom", "groom-sleeves"],
};

export default function MobileCharacter() {
  const readViewport = () => ({ width: window.innerWidth, height: window.innerHeight, coarse: window.matchMedia("(pointer: coarse)").matches });
  const [size, setSize] = useState(readViewport);
  const outfit = useMobileCharacterStore((state) => state.outfit);
  const layout = mobileCharacterLayout(size.width, size.height);
  useEffect(() => {
    const update = () => setSize(readViewport());
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    const pointer = window.matchMedia("(pointer: coarse)");
    pointer.addEventListener("change", update);
    for (const name of Object.values(layers).flat()) {
      const image = new Image(); image.src = `/wardrobe/${name}.svg`;
    }
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      pointer.removeEventListener("change", update);
    };
  }, []);
  if (!isPhoneViewport(size.width, size.height, size.coarse)) return null;
  const clothes = layers[outfit] ?? [];
  const image = (name, clothing = false) => <img key={name} src={`/wardrobe/${name}.svg`}
    className={clothing ? "mobile-character__clothes" : undefined} alt="" draggable={false} />;
  return <div className="mobile-character" role="img" aria-label="Nhân vật thú mỏ vịt xanh"
      style={{ width: layout.width, height: layout.height, bottom: `max(${layout.bottom}px, env(safe-area-inset-bottom))` }}>
      {image("mobile-avatar-back")}
      {clothes[0] && image(clothes[0], true)}
      {image("mobile-avatar-hands")}
      {clothes[1] && image(clothes[1], true)}
      {image("mobile-avatar-front")}
      {clothes[2] && image(clothes[2], true)}
    </div>;
}
