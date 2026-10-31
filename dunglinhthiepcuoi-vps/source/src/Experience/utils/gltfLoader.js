import { useGLTF } from "@react-three/drei";

// Keep Draco decoding on the same origin as the portfolio assets.
useGLTF.setDecoderPath("/draco/");

export { useGLTF };
