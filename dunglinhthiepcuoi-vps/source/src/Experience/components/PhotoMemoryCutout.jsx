import { useEffect, useState } from "react";
import { Html, useCursor } from "@react-three/drei";
import { PaperCutout } from "./PaperScenery";
import PhotoMemoryHint from "./PhotoMemoryHint";
import "./ShanghaiBalloon.scss";

const viewportCenter = (_object, _camera, size) => [size.width / 2, size.height / 2];

export default function PhotoMemoryCutout({ asset, photo, label, alt, float = false, popupSide = "left", hintPlacement = "above", ...props }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  useEffect(() => {
    // Decode before the first hover so the photograph opens without a blank card.
    const image = new Image();
    image.src = photo;
    image.decode?.().catch(() => {});
  }, [photo]);
  useEffect(() => {
    if (!hovered) return;
    const close = () => setHovered(false);
    const escape = (event) => { if (event.key === "Escape") close(); };
    window.addEventListener("wheel", close, { passive: true });
    window.addEventListener("mousedown", close);
    window.addEventListener("blur", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("wheel", close);
      window.removeEventListener("mousedown", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", escape);
    };
  }, [hovered]);

  return <>
    <PaperCutout {...props} asset={asset} float={float}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    />
    {!hovered && <PhotoMemoryHint position={props.position}
      targetHeight={props.size[1]} placement={hintPlacement} />}
    {hovered && <Html fullscreen calculatePosition={viewportCenter}
      style={{ pointerEvents: "none" }} zIndexRange={[90, 90]}>
      <div className={`shanghai-memory${popupSide === "right" ? " shanghai-memory--right" : ""}`} role="tooltip" aria-label={label}>
        <figure className="shanghai-memory__photo">
          <img src={photo} alt={alt} />
        </figure>
      </div>
    </Html>}
  </>;
}
