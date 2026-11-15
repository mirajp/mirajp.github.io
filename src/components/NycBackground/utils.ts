export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const smoothstep = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

export const approachAngle = (
  current: number,
  target: number,
  amount: number,
) => {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  return current + delta * amount;
};

/**
 * Computes user-space strokeWidth so an isotropically scaled `<g>` renders
 * at an exact screen-space pen thickness while keeping `pathLength="1"` and
 * `stroke-dasharray` 100% consistent across Chrome, Safari, and Firefox.
 */
export const strokePx = (screenPx: number, scale: number) =>
  Math.max(0.15, screenPx / Math.max(0.04, Math.abs(scale)));
