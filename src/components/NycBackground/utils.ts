export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const smoothstep = (t: number) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

export const approachAngle = (current: number, target: number, amount: number) => {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * amount;
};
