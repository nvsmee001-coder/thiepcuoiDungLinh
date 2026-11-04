import { useEffect, useState } from "react";
import { Html, useCursor } from "@react-three/drei";
import { PaperCutout } from "./PaperScenery";
import PhotoMemoryHint from "./PhotoMemoryHint";
import "./ShanghaiBalloon.scss";

const viewportCenter = (_object, _camera, size) => [size.width / 2, size.height / 2];

export default function PhotoMemoryCutout({ asset, photo, label, alt, enabled = true, float = false, popupSide = "left", hintPlacement = "above", ...props }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const active = enabled && (hovered || pinned);
  useEffect(() => { if (!enabled) { setHovered(false); setPinned(false); } }, [enabled]);
  useCursor(active);
  useEffect(() => {
    // Decode before the first hover so the photograph opens without a blank card.
    const image = new Image();
    image.src = photo;
    image.decode?.().catch(() => {});
  }, [photo]);
  useEffect(() => {
    if (!active) return;
    const close = () => { setHovered(false); setPinned(false); };
    const escape = (event) => { if (event.key === "Escape") close(); };
    window.addEventListener("wheel", close, { passive: true });
    window.addEventListener("blur", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("wheel", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", escape);
    };
  }, [active]);

  return <>
    <PaperCutout {...props} asset={asset} float={float}
      onPointerOver={(event) => { event.stopPropagation(); if (event.pointerType !== "touch") setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => { event.stopPropagation(); setHovered(false); setPinned((value) => !value); }}
    />
    {!active && <PhotoMemoryHint position={props.position}
      targetHeight={props.size[1]} placement={hintPlacement} />}
    {active && <Html fullscreen calculatePosition={viewportCenter}
      style={{ pointerEvents: "none" }} zIndexRange={[90, 90]}>
      <div className={`shanghai-memory${popupSide === "right" ? " shanghai-memory--right" : ""}`} role="tooltip" aria-label={label}>
        <figure className="shanghai-memory__photo">
          <button className="shanghai-memory__close" data-no-navigation aria-label="Đóng ảnh"
            onClick={() => { setHovered(false); setPinned(false); }}>×</button>
          <img src={photo} alt={alt} />
        </figure>
      </div>
    </Html>}
  </>;
}
