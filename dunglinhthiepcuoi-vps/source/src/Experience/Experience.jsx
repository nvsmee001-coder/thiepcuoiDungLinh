import React, { useRef, useEffect } from "react";
import { Canvas, extend } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import Scene from "./Scene";
import * as THREE from "three/webgpu";
import normalizeWheel from "normalize-wheel";
import { isPhoneViewport, touchNavigationDelta } from "./utils/mobileCharacterLayout";
import PerformanceProbe from "./components/PerformanceProbe";
import RenderQuality from "./components/RenderQuality";
import AnimationClock from "./components/AnimationClock";

const Experience = ({ enabled = true, autoScroll = false, onReady }) => {
  const camera = useRef();
  const cameraGroup = useRef();
  const scrollProgress = useRef(0);
  const targetScrollProgress = useRef(0);
  const baseScrollSpeed = 0.0085;
  const scrollSpeedMultiplier = useRef(1);
  const isSwiping = useRef(false);
  const mousePositionOffset = useRef(new THREE.Vector3());
  const mouseRotationOffset = useRef(new THREE.Euler());
  const lastTouch = useRef(null);
  const touchAxis = useRef(null);
  const pauseScrollUntilRef = useRef(0);

  useEffect(() => {
    const handlePhotoOpened = (e) => {
      const duration = e?.detail?.duration || 1300;
      const now = performance.now();
      // Khóa/hãm cuộn trong khoảng thời gian duration (1.3s)
      pauseScrollUntilRef.current = Math.max(pauseScrollUntilRef.current, now + duration);

      // Triệt tiêu một phần quán tính cuộn cũ để dừng/hãm nhẹ nhàng ngay bức ảnh
      const delta = targetScrollProgress.current - scrollProgress.current;
      if (Math.abs(delta) > 0.012) {
        targetScrollProgress.current = scrollProgress.current + Math.sign(delta) * 0.012;
      }
    };

    window.addEventListener("photo-memory-opened", handlePhotoOpened);
    return () => window.removeEventListener("photo-memory-opened", handlePhotoOpened);
  }, []);

  useEffect(() => {
    if (!enabled) { isSwiping.current = false; lastTouch.current = null; return; }

    const getDampening = () => {
      // Khi đang trong thời gian hãm (ảnh hiện lên): giảm 92% lực lăn chuột
      if (performance.now() < pauseScrollUntilRef.current) {
        return 0.08;
      }
      return 1.0;
    };

    const handleWheel = (e) => {
      const normalized = normalizeWheel(e);
      const dampening = getDampening();

      targetScrollProgress.current +=
        Math.sign(normalized.pixelY) *
        baseScrollSpeed *
        scrollSpeedMultiplier.current *
        dampening *
        Math.min(Math.abs(normalized.pixelY) / 100, 1);
    };

    const handleMouseMove = (e) => {
      if (isPhoneViewport(window.innerWidth, window.innerHeight, window.matchMedia("(pointer: coarse)").matches)) {
        mousePositionOffset.current.set(0, 0, 0);
        mouseRotationOffset.current.set(0, 0, 0);
        return;
      }
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = (e.clientY / window.innerHeight) * 2 - 1;

      const sensitivityX = 0.05;
      const sensitivityY = 0.05;

      mousePositionOffset.current.x = mouseX * sensitivityX;
      mousePositionOffset.current.y = mouseY * sensitivityY;

      const rotationSensitivityX = 0.05;
      const rotationSensitivityY = 0.05;

      mouseRotationOffset.current.x = mouseY * rotationSensitivityX;
      mouseRotationOffset.current.y = mouseX * rotationSensitivityY;
    };

    const handleTouchStart = (e) => {
      if (e.target.closest?.("button, a, input, [data-no-navigation]")) return;
      if (e.touches.length !== 1) {
        isSwiping.current = false;
        lastTouch.current = null;
        return;
      }
      isSwiping.current = true;
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchAxis.current = null;
    };

    const handleTouchMove = (e) => {
      if (!isSwiping.current || e.touches.length !== 1) return;
      if (e.cancelable) e.preventDefault();

      const next = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (lastTouch.current !== null) {
        const dx = next.x - lastTouch.current.x, dy = next.y - lastTouch.current.y;
        touchAxis.current ??= Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        const dampening = getDampening();
        targetScrollProgress.current += touchNavigationDelta(lastTouch.current, next,
          { width: window.innerWidth, height: window.innerHeight }, touchAxis.current) * scrollSpeedMultiplier.current * dampening;
      }
      lastTouch.current = next;
    };

    const handleTouchEnd = (e) => {
      isSwiping.current = false;
      lastTouch.current = null;
    };

    const handleMouseDown = (e) => {
      if (e.target.closest?.("button, a, input, [data-no-navigation]")) return;
      if (e.pointerType === "touch") return;
      isSwiping.current = true;
    };

    const handleMouseDrag = (e) => {
      if (!isSwiping.current || e.pointerType === "touch") return;
      const mouseMultiplier = 0.2;
      const dampening = getDampening();
      targetScrollProgress.current +=
        Math.sign(e.movementY) * baseScrollSpeed * mouseMultiplier *
        scrollSpeedMultiplier.current * dampening;
    };

    const handleMouseUp = () => {
      isSwiping.current = false;
    };

    const handleKeyDown = (event) => {
      if (event.target.closest?.("input, textarea, select")) return;
      const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
      if (!direction) return;
      event.preventDefault();
      const dampening = getDampening();
      targetScrollProgress.current += direction * 0.025 * scrollSpeedMultiplier.current * dampening;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousemove", handleMouseDrag);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseDrag);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled]);

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={enabled ? "always" : "demand"}
      flat={true}
      gl={(props) => {
        extend(THREE);
        const renderer = new THREE.WebGPURenderer({ ...props, powerPreference: "high-performance" });
        return renderer.init().then(() => renderer);
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#e6e3d9"]} />
      <AnimationClock />
      {import.meta.env.VITE_PERFORMANCE_PROBE === "1" && <PerformanceProbe />}
      <RenderQuality />
      <Scene
        cameraGroup={cameraGroup}
        camera={camera}
        scrollProgress={scrollProgress}
        targetScrollProgress={targetScrollProgress}
        onReady={onReady}
        mousePositionOffset={mousePositionOffset}
        mouseRotationOffset={mouseRotationOffset}
        scrollSpeedMultiplier={scrollSpeedMultiplier}
        autoScroll={autoScroll}
        pauseScrollUntilRef={pauseScrollUntilRef}
      />

      <group ref={cameraGroup}>
        <PerspectiveCamera
          ref={camera}
          makeDefault
          fov={35}
          // position={[0, 0, 30]}
        />
        {/* <OrbitControls enableZoom={false} enableRotate={false} /> */}
      </group>
    </Canvas>
  );
};

export default Experience;
