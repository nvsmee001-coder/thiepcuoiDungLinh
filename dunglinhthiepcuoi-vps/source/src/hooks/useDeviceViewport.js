import { useEffect, useState } from "react";
import { isPhoneViewport } from "../Experience/utils/mobileCharacterLayout";

export default function useDeviceViewport() {
  const read = () => {
    const width = window.innerWidth, height = window.innerHeight;
    const phone = isPhoneViewport(width, height, window.matchMedia("(pointer: coarse)").matches);
    return { width, height, phone, portrait: height > width };
  };
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const update = () => setViewport(read());
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);
  return viewport;
}
