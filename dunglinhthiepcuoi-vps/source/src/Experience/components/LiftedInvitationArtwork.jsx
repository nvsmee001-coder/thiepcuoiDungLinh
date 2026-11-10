import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// The photograph and handwriting remain one flat hanging card. Both ropes
// travel with it as the entire invitation is pulled above the viewport.
export default function LiftedInvitationArtwork({ paper, photo, photoHeight, framed, transitionRef }) {
  const card = useRef();
  useFrame(() => {
    const lift = THREE.MathUtils.clamp(transitionRef?.current.lift || 0, 0, 1);
    card.current.position.y = lift * 6;
  }, -1.6);

  return <group ref={card}>
    {[-2.2, 2.2].map((x) => <mesh key={x} position={[x, 4.85, -.01]}
      renderOrder={1} raycast={() => null}>
      <planeGeometry args={[.007, 6]} />
      <meshBasicMaterial color="#a39379" transparent opacity={.9}
        depthTest={false} depthWrite={false} side={THREE.DoubleSide}
        forceSinglePass toneMapped={false} />
    </mesh>)}
    {paper && <mesh position={[0, .4, 0]} renderOrder={2}>
      <planeGeometry args={[5.5, 4.7]} />
      <meshBasicMaterial map={paper} transparent alphaTest={.05}
        depthTest={false} depthWrite={false} side={THREE.DoubleSide}
        forceSinglePass toneMapped={false} />
    </mesh>}
    {framed && <mesh position={[-.85, -.68, .015]} rotation={[0, 0, -.015]} renderOrder={3}>
      <planeGeometry args={[2.36, photoHeight + .2]} />
      <meshBasicMaterial color="#fff9ec" transparent
        depthTest={false} depthWrite={false} side={THREE.DoubleSide}
        forceSinglePass toneMapped={false} />
    </mesh>}
    <mesh position={[-.85, -.68, .025]} rotation={[0, 0, -.015]} renderOrder={3}>
      <planeGeometry args={[2.18, photoHeight]} />
      <meshBasicMaterial map={photo} transparent
        depthTest={false} depthWrite={false} side={THREE.DoubleSide}
        forceSinglePass toneMapped={false} />
    </mesh>
  </group>;
}
