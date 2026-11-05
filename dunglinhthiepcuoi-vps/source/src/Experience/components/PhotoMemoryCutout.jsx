import { useEffect, useState, useRef } from "react";
import { Html, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PaperCutout } from "./PaperScenery";
import PhotoMemoryHint from "./PhotoMemoryHint";
import "./ShanghaiBalloon.scss";

const viewportCenter = (_object, _camera, size) => [size.width / 2, size.height / 2];

export default function PhotoMemoryCutout({
  asset,
  photo,
  label,
  alt,
  enabled = true,
  forceOpen = false,
  float = false,
  popupSide = "left",
  hintPlacement = "above",
  ...props
}) {
  const [pinned, setPinned] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const dismissedRef = useRef(false);
  const anchorRef = useRef();

  // Vector tái sử dụng trong useFrame để tối ưu hiệu năng
  const worldPosRef = useRef(new THREE.Vector3());
  const screenPosRef = useRef(new THREE.Vector3());

  // Tự động kích hoạt khi vật thể thực sự tiến vào chính giữa khung hình
  useFrame(({ camera }) => {
    if (!enabled || !anchorRef.current) return;

    anchorRef.current.getWorldPosition(worldPosRef.current);
    screenPosRef.current.copy(worldPosRef.current).project(camera);

    const sp = screenPosRef.current;
    const isFront = sp.z > 0 && sp.z < 1;

    // Vùng trung tâm: vật thể nằm trong tầm nhìn chính giữa màn hình (25% từ tâm)
    const isCenter = isFront && Math.abs(sp.x) <= 0.25 && Math.abs(sp.y) <= 0.8;
    // Vùng thoát: vật thể trôi ra ngoài mép màn hình (hoặc ra sau lưng)
    const isFar = !isFront || Math.abs(sp.x) > 0.65 || Math.abs(sp.y) > 0.95;

    if (isCenter) {
      if (!dismissedRef.current && !autoOpened) {
        setAutoOpened(true);
        // Báo hiệu ảnh popup vừa hiện lên để làm chậm cuộn 1.3s và đóng các popup cũ
        window.dispatchEvent(new CustomEvent("photo-memory-opened", { detail: { id: asset, duration: 1300 } }));
      }
    } else if (isFar) {
      if (autoOpened) {
        setAutoOpened(false);
      }
      // Khi đã di chuyển xa khỏi vật thể, reset cờ tắt để lần sau quay lại vẫn tự mở
      dismissedRef.current = false;
    }
  });

  const active = enabled && (forceOpen || autoOpened || pinned);

  useEffect(() => {
    if (!enabled) {
      setPinned(false);
      setAutoOpened(false);
    }
  }, [enabled]);

  useCursor(pinned);

  useEffect(() => {
    // Decode ảnh trước để khi bật lên ảnh hiển thị ngay không bị nhấp nháy
    const image = new Image();
    image.src = photo;
    image.decode?.().catch(() => {});
  }, [photo]);

  // Đảm bảo chỉ có DUY NHẤT 1 popup ảnh mở cùng lúc (đóng ảnh cũ khi ảnh mới xuất hiện)
  useEffect(() => {
    const handleOtherOpened = (e) => {
      if (e.detail?.id && e.detail.id !== asset) {
        setAutoOpened(false);
        setPinned(false);
      }
    };
    window.addEventListener("photo-memory-opened", handleOtherOpened);
    return () => window.removeEventListener("photo-memory-opened", handleOtherOpened);
  }, [asset]);

  // Đóng bằng phím Escape hoặc khi chuyển tab
  useEffect(() => {
    if (!active) return;
    const close = () => {
      setPinned(false);
      setAutoOpened(false);
      dismissedRef.current = true;
    };
    const escape = (event) => { if (event.key === "Escape") close(); };
    window.addEventListener("blur", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", escape);
    };
  }, [active]);

  const handleClose = () => {
    setPinned(false);
    setAutoOpened(false);
    dismissedRef.current = true;
  };

  return (
    <>
      <PaperCutout
        ref={anchorRef}
        {...props}
        asset={asset}
        float={float}
        onClick={(event) => {
          event.stopPropagation();
          setPinned((value) => {
            const next = !value;
            if (next) {
              window.dispatchEvent(new CustomEvent("photo-memory-opened", { detail: { id: asset, duration: 1300 } }));
            }
            return next;
          });
        }}
      />
      {!active && (
        <PhotoMemoryHint
          position={props.position}
          targetHeight={props.size[1]}
          placement={hintPlacement}
        />
      )}
      {active && (
        <Html
          fullscreen
          calculatePosition={viewportCenter}
          style={{ pointerEvents: "none" }}
          zIndexRange={[90, 90]}
        >
          <div
            className={`shanghai-memory${popupSide === "right" ? " shanghai-memory--right" : ""}`}
            role="tooltip"
            aria-label={label}
          >
            <figure className="shanghai-memory__photo">
              <button
                className="shanghai-memory__close"
                data-no-navigation
                aria-label="Đóng ảnh"
                onClick={handleClose}
              >
                ×
              </button>
              <img src={photo} alt={alt} />
            </figure>
          </div>
        </Html>
      )}
    </>
  );
}
