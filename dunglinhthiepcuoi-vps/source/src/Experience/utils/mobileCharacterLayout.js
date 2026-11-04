export function isPhoneViewport(width, height, coarsePointer = false) {
  return width <= 767 || (height <= 600 && (coarsePointer || width <= 1180));
}

export function touchScrollDelta(previousY, nextY, viewportHeight) {
  // Swiping upward advances; distance, rather than event count, sets speed.
  return (previousY - nextY) / Math.max(320, viewportHeight) * 0.28;
}

export function touchNavigationDelta(previous, next, viewport, axis) {
  return axis === "x"
    ? (previous.x - next.x) / Math.max(320, viewport.width) * 0.28
    : touchScrollDelta(previous.y, next.y, viewport.height);
}
