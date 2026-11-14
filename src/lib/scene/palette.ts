// One source of truth for day -> sunset -> night. The canvas wash and the page
// background both sample it, so they can never disagree.
type RGB = [number, number, number];

const hex = (h: string): RGB =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

// e = 0 day .. 1 night. Intermediate stops keep the blend vivid (no orange->navy mud).
const KEYS = [
  { e: 0, top: "#6fa8e0", bot: "#bfe0f5", bg: "#f7efe4", line: "#ecdfd0" }, // day
  { e: 0.25, top: "#8fa6d9", bot: "#f6cfa2", bg: "#f3e1cf", line: "#e6d1ba" }, // golden hour: periwinkle into peach
  { e: 0.5, top: "#7a6bb3", bot: "#f2a081", bg: "#e6bca6", line: "#d3a28d" }, // sunset: violet into salmon
  { e: 0.75, top: "#3f3b80", bot: "#d9728c", bg: "#9c6485", line: "#855270" }, // dusk: indigo into rose
  { e: 0.9, top: "#1b1a3c", bot: "#4b305f", bg: "#1d1a2f", line: "#2a2641" }, // twilight: deep indigo into plum
  { e: 1, top: "#070b1f", bot: "#1b2347", bg: "#0a0a0a", line: "#1d1d1d" }, // night
].map((k) => ({
  e: k.e,
  top: hex(k.top),
  bot: hex(k.bot),
  bg: hex(k.bg),
  line: hex(k.line),
}));

export type Sample = { top: RGB; bot: RGB; bg: RGB; line: RGB };

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export function sample(e: number): Sample {
  let i = 0;
  while (i < KEYS.length - 2 && e > KEYS[i + 1].e) i++;
  const a = KEYS[i],
    b = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (e - a.e) / (b.e - a.e)));
  return {
    top: mix(a.top, b.top, t),
    bot: mix(a.bot, b.bot, t),
    bg: mix(a.bg, b.bg, t),
    line: mix(a.line, b.line, t),
  };
}

export const rgbCss = (c: RGB) => `rgb(${c.map(Math.round).join(",")})`;
