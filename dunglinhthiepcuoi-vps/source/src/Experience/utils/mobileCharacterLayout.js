export function isPhoneViewport(width, height, coarsePointer = false) {
  return width <= 767 || (coarsePointer && height <= 600);
}

// A fixed pixel rectangle independent of camera pose and route progress.
export function mobileCharacterLayout(width, height) {
  const avatarWidth = Math.min(width * 0.38, 160, height * 0.27);
  return { width: avatarWidth, height: avatarWidth * 600 / 440, left: 12, bottom: Math.max(34, height * 0.16) };
}

export function touchScrollDelta(previousY, nextY, viewportHeight) {
  // Swiping upward advances; distance, rather than event count, sets speed.
  return (previousY - nextY) / Math.max(320, viewportHeight) * 0.28;
}
