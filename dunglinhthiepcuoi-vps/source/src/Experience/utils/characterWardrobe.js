// Shanghai changes at the castle; the other outfits keep their region entries.
// The separate loop transition returns the character to the welcome outfit.
export const OUTFIT_STAGES = [
  { start: 0.15, outfit: "shanghai" },
  { start: 0.3, outfit: "swim" },
  { start: 0.49, outfit: "hanoi" },
  { start: 0.6, outfit: "quanho" },
  { start: 0.72, outfit: "groom" },
];

export function getCharacterOutfit(progress, transitioning = false) {
  if (transitioning || !Number.isFinite(progress) || progress < 0 || progress > 1) return null;
  for (let i = OUTFIT_STAGES.length - 1; i >= 0; i--) {
    if (progress >= OUTFIT_STAGES[i].start) return OUTFIT_STAGES[i].outfit;
  }
  return null;
}
