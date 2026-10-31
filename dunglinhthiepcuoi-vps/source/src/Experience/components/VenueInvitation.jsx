import { useEffect, useState } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export const INVITATION_LINES = [
  "Tới tham dự lễ thành hôn của chúng tui",
  "tại Trung Tâm Đại Hoàng Sơn Palace",
  "54 Hùng Vương, Bắc Giang, Thành phố Bắc Ninh",
];

let fontReady;
function loadFont() {
  fontReady ??= new FontFace("InvitationHand", "url(/fonts/Mali-Regular.ttf)")
    .load().then((font) => document.fonts.add(font));
  return fontReady;
}

// Handwritten paper card: canvas text works with the WebGPU renderer and
// keeps Vietnamese diacritics intact. The supplied photograph stays unedited.
export default function VenueInvitation() {
  const [paper, setPaper] = useState(null);
  const photo = useTexture("/media/wedding-venue.png");
  photo.colorSpace = THREE.SRGBColorSpace;

  useEffect(() => {
    let cancelled = false;
    let texture;
    loadFont().then(() => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 2200;
      canvas.height = 1560;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(75, 45);
      ctx.bezierCurveTo(620, 18, 1410, 62, 2105, 35);
      ctx.quadraticCurveTo(2170, 85, 2160, 195);
      ctx.lineTo(2175, 1435);
      ctx.quadraticCurveTo(2160, 1520, 2070, 1520);
      ctx.bezierCurveTo(1470, 1535, 650, 1500, 110, 1530);
      ctx.quadraticCurveTo(35, 1510, 40, 1405);
      ctx.lineTo(30, 160);
      ctx.quadraticCurveTo(30, 80, 75, 45);
      ctx.closePath();
      ctx.fillStyle = "#efeee6";
      ctx.fill();
      ctx.strokeStyle = "#606154";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(112,156,179,.43)";
      ctx.lineWidth = 3;
      for (let y = 115; y < 1560; y += 92) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2200, y + 9); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(195,112,104,.55)";
      ctx.beginPath(); ctx.moveTo(140, 0); ctx.lineTo(130, 1560); ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#606154";
      ctx.font = "72px InvitationHand";
      ctx.textBaseline = "middle";
      INVITATION_LINES.forEach((line, row) => {
        ctx.save();
        ctx.translate(1100, 110 + row * 100);
        ctx.rotate(-0.009 + row * 0.006);
        const width = ctx.measureText(line).width;
        ctx.scale(Math.min(1, 1960 / width), 1);
        ctx.textAlign = "left";
        let x = -width / 2;
        [...line].forEach((letter, index) => {
          ctx.save();
          ctx.translate(x, Math.sin(index * 1.6) * 1.3);
          ctx.rotate(Math.sin(index * 2.2) * 0.014);
          ctx.fillText(letter, 0, 0);
          ctx.restore();
          x += ctx.measureText(letter).width;
        });
        ctx.restore();
      });

      // Keep the schedule in the open right column beside the venue photo.
      // The numbers use the same handwriting at more than twice the text size.
      [["Vào ngày ", "28/11"], ["lúc ", "11h00"]].forEach((parts, row) => {
        const sizes = [68, 150];
        const widths = parts.map((part, index) => {
          ctx.font = `${sizes[index]}px InvitationHand`;
          return ctx.measureText(part).width;
        });
        const width = widths.reduce((sum, value) => sum + value, 0);
        ctx.save();
        ctx.translate(1730, 840 + row * 230);
        ctx.rotate(row === 0 ? -0.018 : 0.012);
        ctx.scale(Math.min(1, 700 / width), 1);
        ctx.fillStyle = "#bd4d47";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        let x = -width / 2;
        parts.forEach((part, index) => {
          ctx.font = `${sizes[index]}px InvitationHand`;
          [...part].forEach((letter, letterIndex) => {
            ctx.save();
            ctx.translate(x, Math.sin(letterIndex * 1.6) * 1.3);
            ctx.rotate(Math.sin(letterIndex * 2.2) * 0.014);
            ctx.fillText(letter, 0, 0);
            ctx.restore();
            x += ctx.measureText(letter).width;
          });
        });
        ctx.restore();
      });
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      setPaper(texture);
    }).catch((error) => console.error("Invitation font could not load", error));
    return () => { cancelled = true; texture?.dispose(); };
  }, []);

  return (
    <group>
      <mesh position={[0, 2.7, -0.05]}>
        <boxGeometry args={[0.025, 2.1, 0.025]} />
        <meshBasicMaterial color="#b6926f" />
      </mesh>
      {paper && <mesh renderOrder={2}>
        <planeGeometry args={[5.5, 3.9]} />
        <meshBasicMaterial map={paper} transparent alphaTest={0.05} depthWrite side={THREE.DoubleSide} toneMapped={false} />
      </mesh>}
      <mesh position={[-0.45, -0.68, 0.025]} rotation={[0, 0, -0.015]} renderOrder={3}>
        <planeGeometry args={[2.18, 2.18]} />
        <meshBasicMaterial map={photo} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}
