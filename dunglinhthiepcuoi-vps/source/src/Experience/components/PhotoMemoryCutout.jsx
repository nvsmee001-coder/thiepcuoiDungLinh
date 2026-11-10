import { useId, useLayoutEffect, useRef } from "react";
import { PaperCutout } from "./PaperScenery";
import PhotoMemoryHint from "./PhotoMemoryHint";
import { usePhotoMemories } from "./PhotoMemoryProvider";
import { optimizedPhoto } from "../utils/photoAssets";

export default function PhotoMemoryCutout({ asset, photo, label, alt, children, enabled = true, float = false, popupSide = "left", hintPlacement = "above", autoRadius = 1.65, position = [0, 0, 0], ...props }) {
  const registry = usePhotoMemories(), id = useId(), object = useRef();
  const entry = useRef({ id, object, dismissed: false });
  Object.assign(entry.current, { available: enabled, photo: optimizedPhoto(photo), label, alt,
    popupSide, enterRadius: autoRadius, exitRadius: autoRadius + .75 });
  useLayoutEffect(() => {
    registry.register(id, entry.current);
    return () => registry.unregister(id);
  }, [registry, id]);

  return <group ref={object} position={position}>
    {children || <PaperCutout {...props} position={[0, 0, 0]} asset={asset} float={float} />}
    <PhotoMemoryHint position={[0, 0, 0]}
      targetHeight={props.size[1]} placement={hintPlacement} />
  </group>;
}
