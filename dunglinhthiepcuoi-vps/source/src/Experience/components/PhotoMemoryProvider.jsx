import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chooseNearbyPhoto, shouldPreloadPhoto } from "../utils/photoProximity";
import { isPhoneViewport } from "../utils/mobileCharacterLayout";
import "./ShanghaiBalloon.scss";

const PhotoMemories = createContext(null);
export const usePhotoMemories = () => useContext(PhotoMemories);
const viewportCenter = (_object, _camera, size) => [size.width / 2, size.height / 2];

export default function PhotoMemoryProvider({ riderRef, children }) {
  const entries = useRef(new Map()), selected = useRef(null), loaded = useRef(new Set());
  const overlayAnchor = useRef();
  const world = useMemo(() => new THREE.Vector3(), []);
  const [activeId, setActiveId] = useState(null);
  const size = useThree((state) => state.size);
  const registry = useMemo(() => ({
    register(id, entry) { entries.current.set(id, entry); },
    unregister(id) { entries.current.delete(id); },
  }), []);

  useFrame(() => {
    const rider = riderRef.current;
    if (!rider) return;
    if (overlayAnchor.current) overlayAnchor.current.position.copy(rider.position);
    const riderX = rider.position.x;
    for (const entry of entries.current.values()) {
      const object = entry.object.current;
      if (!object) { entry.enabled = false; continue; }
      object.getWorldPosition(world);
      entry.x = world.x;
      if (Math.abs(entry.x - riderX) > entry.exitRadius) entry.dismissed = false;
      entry.enabled = entry.available && !entry.dismissed && rider.visible && rider.userData.allowMemory !== false;
      // Decode only nearby memories, rather than fetching every large photo
      // under the initial loading screen. Images stay cached on return trips.
      if (entry.available && shouldPreloadPhoto(entry.x, riderX) && !loaded.current.has(entry.photo)) {
        loaded.current.add(entry.photo);
        const image = new Image();
        image.src = entry.photo;
        image.decode?.().catch(() => {});
      }
    }
    const next = chooseNearbyPhoto(entries.current.values(), riderX, selected.current);
    if (next !== selected.current) {
      selected.current = next;
      setActiveId(next);
      if (next !== null) {
        window.dispatchEvent(new CustomEvent("photo-memory-opened", { detail: { id: next, duration: 1500 } }));
      }
    }
  }, -1.75);

  const close = () => {
    const entry = entries.current.get(selected.current);
    if (entry) entry.dismissed = true;
    selected.current = null;
    setActiveId(null);
  };
  useEffect(() => {
    if (activeId === null) return;
    const escape = (event) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [activeId]);

  const active = entries.current.get(activeId);
  const phone = isPhoneViewport(size.width, size.height, window.matchMedia("(pointer: coarse)").matches);
  const side = phone ? "right" : active?.popupSide;
  return <PhotoMemories.Provider value={registry}>
    {children}
    {/* Keep Html's visibility anchor in front of the camera in every loop. */}
    {active && <group ref={overlayAnchor} position={riderRef.current.position.toArray()}>
      <Html fullscreen calculatePosition={viewportCenter} style={{ pointerEvents: "none" }} zIndexRange={[90, 90]}>
      <div className={`shanghai-memory${side === "right" ? " shanghai-memory--right" : ""}`} role="region" aria-label={active.label}>
        <figure key={activeId} className="shanghai-memory__photo">
          <button className="shanghai-memory__close" data-no-navigation aria-label="Đóng ảnh" onClick={close}>×</button>
          <img src={active.photo} alt={active.alt} decoding="async" />
        </figure>
      </div>
      </Html>
    </group>}
  </PhotoMemories.Provider>;
}
