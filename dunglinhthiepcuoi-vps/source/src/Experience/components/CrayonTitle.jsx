import { useEffect, useState } from "react";
import * as THREE from "three";

let fontReady;
export default function CrayonTitle({ text, size = [3.8, .89], ...props }) {
  const [map, setMap] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let texture;
    fontReady ??= new FontFace("CrayonHand", "url(/fonts/Mali-Bold.ttf)")
      .load().then((font) => document.fonts.add(font));
    fontReady.then(() => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1536; canvas.height = 360;
      const ctx = canvas.getContext("2d");
      ctx.font = "224px CrayonHand";
      ctx.textBaseline = "middle";
      const colors = ["#d47f79", "#c99a50", "#729f9b", "#9d88ad", "#d18d6d", "#7e9c82", "#bd7c95", "#789cb2"];
      const width = ctx.measureText(text).width;
      ctx.translate(768, 184);
      const fit = Math.min(1, 1440 / width);
      ctx.scale(fit, 1);
      let x = -width / 2;
      [...text].forEach((letter, i) => {
        ctx.save();
        ctx.translate(x, Math.sin(i * 1.7) * 7);
        ctx.rotate(Math.sin(i * 2.4) * .045);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillText(letter, 0, 0);
        ctx.globalAlpha = .4;
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2;
        ctx.strokeText(letter, 1.5, -1);
        ctx.restore();
        x += ctx.measureText(letter).width;
      });
      ctx.resetTransform();
      // Deterministic wax gaps and pencil streaks reveal the notebook below.
      let seed = 137;
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 21000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${.12 + random() * .58})`;
        ctx.fillRect(random() * 1536, random() * 360, .6 + random() * 2.8, .5 + random() * 1.5);
      }
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      setMap(texture);
    });
    return () => { cancelled = true; texture?.dispose(); };
  }, [text]);
  return map && <mesh {...props} renderOrder={2}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={map} transparent alphaTest={.04} depthWrite side={THREE.DoubleSide} toneMapped={false} />
  </mesh>;
}
