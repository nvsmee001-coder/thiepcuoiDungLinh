import { createContext, useContext } from "react";
import { CITY_SCALE, CITY_START } from "../utils/cityLayout";

const CityScale = createContext(1);
export const useCityLayoutScale = () => useContext(CityScale);

export default function CityLayout({ children }) {
  return <CityScale.Provider value={CITY_SCALE}>
    <group position={[CITY_START * (1 - CITY_SCALE), 0, 0]} scale={[CITY_SCALE, 1, 1]}>
      {children}
    </group>
  </CityScale.Provider>;
}
