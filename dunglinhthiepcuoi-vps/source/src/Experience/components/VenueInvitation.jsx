import { useEffect, useState } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export const INVITATION_LINES = [
  "Tới tham dự lễ thành hôn của chúng tui",
  "tại Trung Tâm Đại Hoàng Sơn Palace",
  "54 Hùng Vương, Bắc Giang, Thành phố Bắc Ninh",
];

export const VENUE_DETAILS = {
  groom: {
    lines: INVITATION_LINES,
    photo: "/media/wedding-venue.png",
    label: "Nếu tham dự nhà trai",
    corner: "left",
    schedule: [["Vào ngày ", "28/11"], ["lúc ", "11h00"]],
  },
  bride: {
    lines: [
      "Tới tham dự lễ thành hôn của chúng tui",
      "tại Trống Đồng Palace",
      "65 Quán Sứ, Trần Hưng Đạo, Hoàn Kiếm, thủ đô Hà Nội",
    ],
    photo: "/media/trong-dong-venue.png",
    label: "Nếu tham dự nhà gái",
    corner: "right",
    schedule: [["Vào ngày ", "27/11"], ["lúc ", "11h00"]],
  },
};

let fontReady;
function loadFont() {
  fontReady ??= Promise.all([
    new FontFace("InvitationHand", "url(/fonts/Mali-Regular.ttf)").load(),
    new FontFace("InvitationCrayon", "url(/fonts/Mali-Bold.ttf)").load(),
  ]).then((fonts) => fonts.forEach((font) => document.fonts.add(font)));
  return fontReady;
}

// Handwritten paper card: canvas text works with the WebGPU renderer and
// keeps Vietnamese diacritics intact. The supplied photograph stays unedited.
export default function VenueInvitation({ side = "groom" }) {
  const details = VENUE_DETAILS[side];
  const [paper, setPaper] = useState(null);
  const photo = useTexture(details.photo);
  photo.colorSpace = THREE.SRGBColorSpace;
  const photoHeight = side === "bride" ? 2.18 * 1351 / 2048 : 2.18;

  useEffect(() => {
    let cancelled = false;
    let texture;
    loadFont().then(() => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 2200;
      canvas.height = 1880;
      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.translate(0, 320);
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
      details.lines.forEach((line, row) => {
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
      details.schedule.forEach((parts, row) => {
        const sizes = [68, 150];
        const widths = parts.map((part, index) => {
          ctx.font = `${sizes[index]}px InvitationHand`;
          return ctx.measureText(part).width;
        });
        const width = widths.reduce((sum, value) => sum + value, 0);
        ctx.save();
        ctx.translate(1760, 840 + row * 230);
        ctx.rotate(row === 0 ? -0.018 : 0.012);
        ctx.scale(Math.min(1, 680 / width), 1);
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
      ctx.restore();

      // The transparent strip above the paper holds a small wax-pencil label.
      // Mirrored curves point at the requested left/right upper corner.
      ctx.font = "100px InvitationCrayon";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      const colors = ["#ac7c72", "#b99a66", "#7f9e91", "#9e88a9"];
      const labelWidth = ctx.measureText(details.label).width;
      ctx.save();
      ctx.translate(details.corner === "left" ? 680 : 1520, 145);
      ctx.scale(Math.min(1, 1100 / labelWidth), 1);
      let labelX = -labelWidth / 2;
      [...details.label].forEach((letter, index) => {
        ctx.save();
        ctx.translate(labelX, Math.sin(index * 1.7) * 3);
        ctx.rotate(Math.sin(index * 2.4) * 0.025);
        ctx.fillStyle = colors[Math.floor(index / 4) % colors.length];
        ctx.fillText(letter, 0, 0);
        ctx.restore();
        labelX += ctx.measureText(letter).width;
      });
      ctx.restore();
      ctx.save();
      if (details.corner === "right") {
        ctx.translate(2200, 0);
        ctx.scale(-1, 1);
      }
      ctx.strokeStyle = "#9b8670";
      ctx.lineWidth = 6;
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(155, 163);
      ctx.bezierCurveTo(30, 182, 26, 265, 80, 348);
      ctx.moveTo(48, 330);
      ctx.lineTo(80, 348);
      ctx.lineTo(82, 308);
      ctx.stroke();
      ctx.restore();
      let seed = 137;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 9000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.15 + random() * 0.45})`;
        ctx.fillRect(random() * 2200, random() * 310, 1 + random() * 2, 0.8);
      }
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      setPaper(texture);
    }).catch((error) => console.error("Invitation font could not load", error));
    return () => { cancelled = true; texture?.dispose(); };
  }, [details]);

  return (
    <group>
      <mesh position={[0, 2.7, -0.05]}>
        <boxGeometry args={[0.025, 2.1, 0.025]} />
        <meshBasicMaterial color="#b6926f" />
      </mesh>
      {paper && <mesh position={[0, 0.4, 0]} renderOrder={2}>
        <planeGeometry args={[5.5, 4.7]} />
        <meshBasicMaterial map={paper} transparent alphaTest={0.05} depthWrite side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
      </mesh>}
      {side === "bride" && <mesh position={[-0.85, -0.68, 0.015]} rotation={[0, 0, -0.015]} renderOrder={3}>
        <planeGeometry args={[2.36, photoHeight + 0.2]} />
        <meshBasicMaterial color="#fff9ec" side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
      </mesh>}
      <mesh position={[-0.85, -0.68, 0.025]} rotation={[0, 0, -0.015]} renderOrder={3}>
        <planeGeometry args={[2.18, photoHeight]} />
        <meshBasicMaterial map={photo} side={THREE.DoubleSide} forceSinglePass toneMapped={false} />
      </mesh>
    </group>
  );
}
