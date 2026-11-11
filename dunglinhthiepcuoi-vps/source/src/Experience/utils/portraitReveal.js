// Enter only when the protagonist is about one world unit from the portrait.
// A small return margin prevents repeated folding at the approach threshold.
export function portraitShouldStand(progress, wasStanding = false) {
  if (!Number.isFinite(progress) || progress > 0.94) return false;
  return progress >= (wasStanding ? 0.795 : 0.81);
}
