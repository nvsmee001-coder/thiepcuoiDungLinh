const ENTER_RADIUS = 1.15;
const EXIT_RADIUS = 1.65;
const SWITCH_MARGIN = .35;

const validRadius = (value, fallback) => Number.isFinite(value) && value >= 0 ? value : fallback;
const comesBefore = (a, b) => String(a) < String(b);

// Route distance deliberately uses only world X: photo markers can sit above
// the rider. Dismissed markers can be excluded by setting enabled to false.
export function chooseNearbyPhoto(triggers, riderX, currentId, options = {}) {
  if (!Number.isFinite(riderX) || typeof triggers?.[Symbol.iterator] !== "function") return null;

  const switchMargin = validRadius(options?.switchMargin, SWITCH_MARGIN);
  let current = null;
  let nearest = null;

  for (const trigger of triggers) {
    if (!trigger || trigger.id == null || trigger.enabled === false || !Number.isFinite(trigger.x)) continue;

    const enterRadius = validRadius(trigger.enterRadius, ENTER_RADIUS);
    const exitRadius = Math.max(enterRadius, validRadius(trigger.exitRadius, EXIT_RADIUS));
    const distance = Math.abs(trigger.x - riderX);

    if (trigger.id === currentId && distance <= exitRadius) current = { id: trigger.id, distance };
    if (distance <= enterRadius && (!nearest || distance < nearest.distance
      || (distance === nearest.distance && comesBefore(trigger.id, nearest.id)))) {
      nearest = { id: trigger.id, distance };
    }
  }

  if (current && (!nearest || nearest.id === current.id || nearest.distance >= current.distance - switchMargin)) {
    return current.id;
  }
  return nearest?.id ?? null;
}

export function shouldPreloadPhoto(triggerX, riderX, radius = 6) {
  return Number.isFinite(triggerX) && Number.isFinite(riderX)
    && Number.isFinite(radius) && radius >= 0 && Math.abs(triggerX - riderX) <= radius;
}
