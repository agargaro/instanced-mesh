export type Ease = (t: number) => number;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export const linear: Ease = (t) => t;

export const easeInOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const easeInOutQuint: Ease = (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2);

export const easeInOutSine: Ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);

/** 1 inside the window, fading at both edges — used for one-shot clips. */
export const pulse = (t: number, duration: number, fadeIn = 0.1, fadeOut = 0.15) =>
  t <= 0 || t >= duration ? 0 : smooth(Math.min(1, t / fadeIn, (duration - t) / fadeOut));

export const segment = (time: number, times: number[]) => {
  let i = 0;
  while (i < times.length - 1 && times[i + 1] <= time) i++;
  if (i >= times.length - 1) return { i, u: 1 };
  const span = Math.max(1e-4, times[i + 1] - times[i]);
  return { i, u: clamp01((time - times[i]) / span) };
};
