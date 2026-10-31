import { useEffect, useState } from "react";
import * as THREE from "three";

let fontsReady;
function loadFonts() {
  if (!fontsReady) {
    fontsReady = new FontFace(
      "WeddingHand", "url(/fonts/Mali-Bold.ttf)"
    ).load().then((font) => document.fonts.add(font));
  }
  return fontsReady;
}

export const WELCOME_LINES = [
  "chào mừng đến với",
  "lễ thành hôn của",
  "Nguyễn Lê Dũng",
  "&",
  "Phạm Khánh Linh",
];
export const STORY_LINES = ["Câu chiện tình iu", "của chúng tui"];

// Use a canvas texture so Vietnamese text works with the WebGPU renderer
// without a shader-based text material or a remote font service.
export default function WeddingText({ kind }) {
  const [texture, setTexture] = useState(null);
  const welcome = kind === "welcome";

  useEffect(() => {
    let cancelled = false;
    let map;
    async function draw() {
      await loadFonts();
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1536;
      canvas.height = welcome ? 1054 : 1517;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#626356";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      function handwritten(text, size, y, maxWidth) {
        ctx.save();
        ctx.font = `${size}px WeddingHand`;
        ctx.translate(canvas.width / 2, y);
        ctx.rotate(-0.025);
        const width = ctx.measureText(text).width;
        const fit = Math.min(1, maxWidth / width);
        ctx.scale(fit, 1);
        ctx.textAlign = "left";
        let x = -width / 2;
        for (const [index, letter] of [...text].entries()) {
          ctx.save();
          ctx.translate(x, Math.sin(index * 1.9) * 1.2);
          ctx.rotate(Math.sin(index * 2.3) * 0.012);
          ctx.fillText(letter, 0, 0);
          ctx.restore();
          x += ctx.measureText(letter).width;
        }
        ctx.restore();
      }
      if (welcome) {
        const lines = [
          [WELCOME_LINES[0], 83, "WeddingHand", 190],
          [WELCOME_LINES[1], 83, "WeddingHand", 325],
          [WELCOME_LINES[2], 111, "WeddingHand", 505],
          [WELCOME_LINES[3], 78, "WeddingHand", 640],
          [WELCOME_LINES[4], 111, "WeddingHand", 785],
        ];
        for (const [text, size, , y] of lines) {
          handwritten(text, size, y, canvas.width - 100);
        }
      } else {
        STORY_LINES.forEach((line, row) => {
          handwritten(line, 100, 285 + row * 150, canvas.width - 70);
        });
      }
      map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      setTexture(map);
    }
    draw().catch((error) => console.error("Wedding text could not load", error));
    return () => {
      cancelled = true;
      map?.dispose();
    };
  }, [welcome]);

  if (!texture) return null;
  return (
    <mesh renderOrder={2}>
      <planeGeometry args={welcome ? [2.32156, 1.59343] : [1.97021, 1.94587]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} depthWrite side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
