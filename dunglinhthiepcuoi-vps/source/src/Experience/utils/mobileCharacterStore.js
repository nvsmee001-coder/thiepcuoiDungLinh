import { create } from "zustand";

export const useMobileCharacterStore = create(() => ({ outfit: null }));
export function updateMobileOutfit(outfit) {
  if (useMobileCharacterStore.getState().outfit !== outfit) {
    useMobileCharacterStore.setState({ outfit });
  }
}
