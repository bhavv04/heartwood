// components/skyCanvas.ts
/* Dithered pixel-art sky. Pure canvas drawing, no React. */

import { sample } from "@/lib/scene/palette";

export const P = 3; // cell pitch (css px)
export const DOT = 2; // dither dot size (css px)
export const ROWS = 130; // sky height in cells (= 390px)

const MOON_R = 20;
const SUN_R = 20;
const HALO = 25; // halo thickness in cells
const CY = Math.round(ROWS * 0.4); // resting centre row of sun / moon (middle of the sky)
const ARC_Y = Math.round(ROWS * 0.8); // row where the arc meets the screen edges (higher = shallower dip)
const SWEEP = 100; // degrees travelled along the arc during a swap

type Ctx = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  createLinearGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): CanvasGradient;
};

/* ------------------------------ helpers ---------------------------- */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => (v + 0.5) / 16,
);
const bay = (x: number, y: number) => BAYER[((y & 3) << 2) | (x & 3)];
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const OFF = (P - DOT) / 2;
const dot = (ctx: Ctx, x: number, y: number) =>
  ctx.fillRect(x * P + OFF, y * P + OFF, DOT, DOT);
const cell = (ctx: Ctx, x: number, y: number) =>
  ctx.fillRect(x * P, y * P, P, P);

const rgb = (h: string) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp3 = (a: number[], b: number[], t: number) =>
  a.map((v, i) => v + (b[i] - v) * t);
const css = (c: number[]) => `rgb(${c.map((v) => Math.round(v)).join(",")})`;
const frac = (v: number) => v - Math.floor(v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mod = (a: number, n: number) => ((a % n) + n) % n;

/* ------------------------------ clouds ----------------------------- */
// Each cloud is a cluster of round puffs on a flat base, lit from the upper left.
// The shape is built once (dither pattern included); only colours / position /
// rain change per frame. Clouds drift left to right and wrap around the edges.
//   x = starting position (fraction of width)   y = base row (fraction of ROWS)
//   w, h = size in cells
//   v = drift speed in cells / second (lower clouds are nearer, so faster)
//   per / ph = period (s) and phase of a tiny vertical bob
const CLOUD_SCALE = 1.5; // size multiplier applied to every cloud's w / h
const RAW_SPECS = [
  { x: 0.1, y: 0.2, w: 20, h: 10, v: 1.6, per: 55, ph: 0.0, seed: 11 },
  { x: 0.3, y: 0.14, w: 24, h: 12, v: 1.4, per: 62, ph: 1.1, seed: 23 },
  { x: 0.62, y: 0.2, w: 22, h: 11, v: 1.7, per: 58, ph: 2.4, seed: 29 },
  { x: 0.86, y: 0.3, w: 30, h: 14, v: 2.2, per: 65, ph: 1.5, seed: 31 },
  { x: 0.2, y: 0.45, w: 26, h: 13, v: 2.6, per: 52, ph: 4.0, seed: 43 },
  { x: 0.5, y: 0.5, w: 18, h: 9, v: 2.0, per: 48, ph: 0.4, seed: 47 },
  { x: 0.76, y: 0.55, w: 28, h: 13, v: 2.9, per: 60, ph: 3.3, seed: 53 },
  { x: 0.12, y: 0.7, w: 40, h: 20, v: 3.4, per: 70, ph: 3.0, seed: 37 },
  { x: 0.4, y: 0.78, w: 22, h: 11, v: 3.0, per: 50, ph: 2.0, seed: 59 },
  { x: 0.68, y: 0.82, w: 36, h: 17, v: 3.6, per: 60, ph: 0.7, seed: 41 },
  { x: 0.92, y: 0.76, w: 24, h: 12, v: 3.1, per: 56, ph: 5.1, seed: 61 },
];
const SPECS = RAW_SPECS.map((s) => ({
  ...s,
  w: Math.round(s.w * CLOUD_SCALE),
  h: Math.round(s.h * CLOUD_SCALE),
}));

const WISP = 4; // how far (cells) stray dots can drift from the cloud body
const WISP_DENSITY = 0.32; // chance of a dot right next to the cloud (falls off with distance)
const RAGGED = 0.18; // chance an outermost edge cell is dropped

type Spec = (typeof SPECS)[number];
type Shape = {
  tones: number[][]; // [highlight, light, body, shadow] -> flat [x, y, x, y ...] relative to the base centre
  minX: number;
  maxX: number;
  minY: number; // negative: rows above the base
  has(lx: number, ly: number): boolean;
};

function buildShape(sp: Spec): Shape {
  let seed = sp.seed;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;

  // puffs: [centre x, centre y (negative = up), radius]
  const puffs: number[][] = [];
  // more, smaller puffs than before = a lumpier, more natural silhouette
  const n = Math.max(4, Math.round(sp.w / 8));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const bell = Math.sin(Math.PI * t) ** 0.8; // taller in the middle
    const r = sp.h * (0.28 + 0.42 * bell) * (0.8 + 0.4 * rnd());
    puffs.push([(t - 0.5) * sp.w, -r * 0.5, r]);
  }
  puffs.push([(rnd() - 0.5) * sp.w * 0.3, -sp.h * 0.55, sp.h * 0.5]); // crown
  puffs.push([(rnd() - 0.5) * sp.w * 0.5, -sp.h * 0.45, sp.h * 0.38]);

  const minX = Math.floor(Math.min(...puffs.map(([px, , pr]) => px - pr)));
  const maxX = Math.ceil(Math.max(...puffs.map(([px, , pr]) => px + pr)));
  const minY = Math.floor(Math.min(...puffs.map(([, py, pr]) => py - pr)));
  const W = maxX - minX + 1,
    H = -minY + 1; // row index iy = ly - minY, base row = H - 1

  // brightness per cell (lit from the upper left), -9 = outside
  const bm = Array.from({ length: H }, () => new Float32Array(W).fill(-9));
  for (let iy = 0; iy < H; iy++)
    for (let ix = 0; ix < W; ix++) {
      const lx = ix + minX,
        ly = iy + minY;
      if (ly > 0) continue; // flat base: nothing hangs below the base row
      let best = -9,
        bestNz = -1;
      for (const [px, py, pr] of puffs) {
        const u = (lx - px) / pr,
          v = (ly - py) / pr,
          d2 = u * u + v * v;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2);
        if (nz > bestNz) {
          bestNz = nz;
          best = -0.45 * u - 0.6 * v + 0.7 * nz;
        } // creases between puffs go dark
      }
      bm[iy][ix] = best;
    }
  const inside = (ix: number, iy: number) =>
    ix >= 0 && iy >= 0 && ix < W && iy < H && bm[iy][ix] > -9;

  const tones: number[][] = [[], [], [], []];
  for (let iy = 0; iy < H; iy++)
    for (let ix = 0; ix < W; ix++) {
      if (!inside(ix, iy)) continue;
      const lx = ix + minX,
        ly = iy + minY;
      const rim = !inside(ix, iy - 1); // bright outline along the top edge
      // ragged edge: now and then an outermost cell is simply missing, so the
      // outline isn't a perfect curve (the base rows stay crisp)
      const edge =
        !inside(ix, iy - 1) || !inside(ix - 1, iy) || !inside(ix + 1, iy);
      if (edge && ly < -1 && rnd() < RAGGED) continue;
      // brightness -> a continuous shade 0 (highlight) .. 3 (shadow). Every cell
      // is filled solid; the ordered dither only decides between the two
      // nearest shades, which gives smooth pixel-art gradients.
      let f = (1 - clamp(bm[iy][ix] / 0.95)) * 3;
      // shadowed belly: the bottom three rows darken towards a crisp base line
      f = Math.max(f, ly === 0 ? 3 : ly === -1 ? 2.6 : ly === -2 ? 2.2 : 0);
      const tone = rim
        ? 0
        : clamp(
            Math.floor(f) + (bay(lx, ly) < f - Math.floor(f) ? 1 : 0),
            0,
            3,
          );
      tones[tone].push(lx, ly);
    }

  // stray wisps: loose dots scattered just outside the silhouette, thinning out
  // with distance, so the cloud reads as soft and irregular rather than a
  // perfect shape. They're draw-only (hit-testing still uses the solid shape).
  let wMinX = minX,
    wMaxX = maxX;
  for (let iy = -WISP; iy < H; iy++)
    for (let ix = -WISP; ix < W + WISP; ix++) {
      if (inside(ix, iy)) continue;
      let d = WISP + 1;
      for (let dy = -WISP; dy <= WISP; dy++)
        for (let dx = -WISP; dx <= WISP; dx++)
          if (inside(ix + dx, iy + dy)) d = Math.min(d, Math.hypot(dx, dy));
      if (d > WISP) continue;
      const ly = iy + minY,
        lx = ix + minX;
      // denser near the shape; sparser along the flat underside
      const p =
        WISP_DENSITY * (1 - (d - 1) / WISP) ** 1.5 * (ly > -2 ? 0.35 : 1);
      if (rnd() >= p) continue;
      const tone = clamp(
        Math.floor(1 + ((iy + WISP) / (H + WISP)) * 2.4),
        1,
        3,
      );
      tones[tone].push(lx, ly);
      wMinX = Math.min(wMinX, lx);
      wMaxX = Math.max(wMaxX, lx);
    }

  return {
    tones,
    minX: wMinX,
    maxX: wMaxX,
    minY,
    has: (lx, ly) => inside(lx - minX, ly - minY),
  };
}

type CloudState = {
  off: number;
  glow: number;
  rain: number;
  rainOn: boolean;
  rainUntil: number;
  bounce: number;
  cx: number;
  by: number; // last drawn position (for hit-testing)
};

// [highlight, light, body, shadow]
// Day clouds are a cool blue-grey so they stand out against a light or cream
// page; the old warm beige blended straight into it.
const CLOUD_DAY = ["#e3ebf4", "#c3d2e2", "#9fb4ca", "#7189a6"].map(rgb);
const CLOUD_NIGHT = ["#62626e", "#505060", "#3e3e4a", "#292932"].map(rgb);
const SUNLIT = rgb("#fff0cc"); // warm light on clouds near the sun
const MOONLIT = rgb("#c9d6ff"); // cool light on clouds near the moon
const SUNSET = rgb("#ff9a6a"); // orange wash on cloud tops while the sun is low
const GLOW_DAY = rgb("#dde8f3"),
  GLOW_NIGHT = rgb("#b0b0bc"); // hover tint (kept off pure white so it never vanishes)
const RAINY_DAY = rgb("#6c788a"),
  RAINY_NIGHT = rgb("#3c3c47"); // stormier = darker
const DROP_DAY = rgb("#4a82b3"),
  DROP_NIGHT = rgb("#8c97ad");
const RAIN_LEN = 36; // rows a drop falls (scaled up with the bigger clouds)

/* ------------------------------ sky wash --------------------------- */
// Sunset / sunrise colours, sampled from the shared palette. The gradient ends
// on the page's own background colour, so it melts into the page with no seam.
const rgba = (c: number[], a: number) =>
  `rgba(${c.map((v) => Math.round(v)).join(",")},${a})`;

function skyWash(ctx: Ctx, w: number, h: number, e: number) {
  const a = Math.sin(Math.PI * e) ** 0.6 * 0.95; // 0 at rest, peaks mid-swap
  if (a < 0.01) return;
  const s = sample(e);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, rgba(s.top, a));
  g.addColorStop(0.7, rgba(s.bot, a));
  g.addColorStop(1, rgba(s.bg, a)); // = the page colour right below the canvas
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ------------------------------ bodies ----------------------------- */
type HaloCells = {
  dx: Int16Array;
  dy: Int16Array;
  tt: Float32Array; // 0 at the disc edge .. 1 at the outer rim
  fall: Float32Array; // dither threshold at k = 1
};
const haloCache = new Map<string, HaloCells>();
function haloCells(r: number, pow: number, amp: number): HaloCells {
  const key = `${r}:${pow}:${amp}`;
  let h = haloCache.get(key);
  if (h) return h;
  const R = r + HALO;
  const all: number[][] = [];
  for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dy);
      if (d <= r || d > R) continue;
      const tt = (d - r) / (R - r);
      all.push([dx, dy, tt, amp * (1 - tt) ** pow]);
    }
  all.sort((p, q) => p[2] - q[2]); // inner bands first -> few fillStyle switches
  h = {
    dx: Int16Array.from(all, (c) => c[0]),
    dy: Int16Array.from(all, (c) => c[1]),
    tt: Float32Array.from(all, (c) => c[2]),
    fall: Float32Array.from(all, (c) => c[3]),
  };
  haloCache.set(key, h);
  return h;
}

// Dithered glow in colour bands: cols[i] is used from edges[i-1] to edges[i]
// (distance across the halo, 0..1). k = intensity (dim at rest, 1 when
// hovering); pow / amp shape how fast it fades. t adds a slow breathing pulse
// so the halo never looks frozen.
function halo(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  cols: string[],
  edges: number[],
  k: number,
  t: number,
  pow = 1.6,
  amp = 0.75,
) {
  const h = haloCells(r, pow, amp);
  const kb = k * (1 + 0.12 * Math.sin(t * 1.6));
  let band = 0;
  ctx.fillStyle = cols[0];
  for (let i = 0; i < h.fall.length; i++) {
    while (band < edges.length && h.tt[i] >= edges[band])
      ctx.fillStyle = cols[++band];
    const x = cx + h.dx[i],
      y = cy + h.dy[i];
    if (y < 0 || y >= ROWS) continue;
    if (bay(x, y) < kb * h.fall[i]) dot(ctx, x, y);
  }
}

// Sun rays: dotted spokes that slowly rotate and fade in while the sun is
// hovered. Long and short spokes alternate.
const RAY_COUNT = 12;
function sunRays(ctx: Ctx, cx: number, cy: number, t: number, g: number) {
  if (g < 0.02) return;
  const base = ctx.globalAlpha;
  ctx.fillStyle = "#f4a83c";
  const spin = t * 0.12;
  for (let i = 0; i < RAY_COUNT; i++) {
    const a = spin + (i / RAY_COUNT) * 2 * Math.PI;
    const len = i % 2 ? 9 : 16;
    for (let s = 0; s < len; s++) {
      const d = SUN_R + 3 + s;
      const x = Math.round(cx + Math.cos(a) * d),
        y = Math.round(cy + Math.sin(a) * d);
      if (y < 0 || y >= ROWS) continue;
      ctx.globalAlpha = base * g * (1 - s / len);
      dot(ctx, x, y);
    }
  }
  ctx.globalAlpha = base;
}

// The sun and moon discs never change shape, so build their cells once as
// offsets from the centre, grouped by brightness level.
function buildDisc(
  r: number,
  levels: number,
  brightness: (u: number, v: number, d2: number) => number,
) {
  const buckets: number[][] = Array.from({ length: levels }, () => []);
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const u = dx / r,
        v = dy / r,
        d2 = u * u + v * v;
      if (d2 > 1) continue;
      const b = brightness(u, v, d2);
      buckets[clamp(Math.floor(b * levels), 0, levels - 1)].push(dx, dy);
    }
  return buckets;
}

function drawDisc(
  ctx: Ctx,
  cx: number,
  cy: number,
  buckets: number[][],
  colors: string[],
) {
  buckets.forEach((arr, i) => {
    ctx.fillStyle = colors[i];
    for (let j = 0; j < arr.length; j += 2) {
      const y = cy + arr[j + 1];
      if (y >= 0 && y < ROWS) cell(ctx, cx + arr[j], y);
    }
  });
}

// Richer gold than before: the old pale yellow disappeared on a light page.
const SUN_LV = ["#e39a2d", "#efb039", "#f6c64f", "#fcdc78", "#fff2b8"];
const SUN_CELLS = buildDisc(SUN_R, 5, (u, v, d2) =>
  Math.max(0, -0.35 * u - 0.35 * v + 0.85 * Math.sqrt(1 - d2)),
);
// little nubs at the cardinal points
SUN_CELLS[0].push(0, -SUN_R - 1, 0, SUN_R + 1, -SUN_R - 1, 0, SUN_R + 1, 0);

// Low sun: same five shades pushed toward a deep orange-red.
const SUN_RGB = SUN_LV.map(rgb);
const SUN_LOW = ["#b8401f", "#d4552a", "#ec7336", "#f9944a", "#ffc27a"].map(
  rgb,
);
const HALO_IN = rgb("#ffd45e"),
  HALO_OUT = rgb("#f4a83c"),
  HALO_IN_LOW = rgb("#ff8a4a"),
  HALO_OUT_LOW = rgb("#e0563a");

function drawSun(
  ctx: Ctx,
  cx: number,
  cy: number,
  k: number,
  t: number,
  glow: number,
  low: number, // 0 = high in the sky .. 1 = on the horizon
) {
  halo(
    ctx,
    cx,
    cy,
    SUN_R,
    [
      css(lerp3(HALO_IN, HALO_IN_LOW, low)),
      css(lerp3(HALO_OUT, HALO_OUT_LOW, low)),
    ],
    [0.3],
    k,
    t,
  );
  sunRays(ctx, cx, cy, t, glow);
  drawDisc(
    ctx,
    cx,
    cy,
    SUN_CELLS,
    SUN_RGB.map((c, i) => css(lerp3(c, SUN_LOW[i], low))),
  );
}

// Brighter, slightly cool palette (dark limb -> white highlight).
const MOON_LV = [
  "#3b3e4c",
  "#5e6274",
  "#868ba0",
  "#adb3c8",
  "#cdd3e6",
  "#e6eaf7",
  "#f6f8ff",
  "#ffffff",
];
// Maria: broad soft dark patches. Craters: dark floor, bright lower-right lip
// (the wall that faces the light), dim upper-left lip.
const MARIA = [
  [-0.32, -0.28, 0.36],
  [0.2, -0.02, 0.32],
  [-0.08, 0.44, 0.27],
];
const CRATERS = [
  [-0.35, -0.4, 0.2],
  [0.3, -0.15, 0.26],
  [-0.05, 0.4, 0.24],
  [0.45, 0.4, 0.17],
  [-0.55, 0.12, 0.13],
];
const MOON_PHASE = 0.68; // 0 new, 0.5 full, 1 new again (waning gibbous: lit on the left)
const TERM = Math.cos(2 * Math.PI * MOON_PHASE); // terminator sweep, -1 .. 1
const MOON_CELLS = buildDisc(MOON_R, MOON_LV.length, (u, v, d2) => {
  let b =
    Math.max(0, -0.45 * u - 0.45 * v + 0.77 * Math.sqrt(1 - d2)) * 1.3 + 0.1;
  for (const [cu, cv, cr] of MARIA) {
    const d = Math.hypot(u - cu, v - cv) / cr;
    if (d < 1) b *= 1 - 0.3 * (1 - d * d);
  }
  for (const [cu, cv, cr] of CRATERS) {
    const du = u - cu,
      dv = v - cv,
      d = Math.hypot(du, dv) / cr;
    if (d < 0.78) b *= 0.62;
    else if (d < 1) b *= du + dv > 0 ? 1.3 : 0.78;
  }
  // soft terminator: the unlit side keeps a faint earthshine
  const tm = clamp((u + TERM * Math.sqrt(1 - v * v)) / 0.18);
  return b * (1 - 0.78 * tm * tm * (3 - 2 * tm));
});

// Halo: pure white hugging the disc, then fading through pale blue to a faint
// blue-grey, with a steep falloff so it is sparse well before the outer rim.
const MOON_HALO = ["#ffffff", "#e4ebff", "#aebbe6", "#7886b8"];
const MOON_HALO_EDGES = [0.1, 0.28, 0.55];
function drawMoon(ctx: Ctx, cx: number, cy: number, k: number, t: number) {
  halo(ctx, cx, cy, MOON_R, MOON_HALO, MOON_HALO_EDGES, k, t, 2.6, 1);
  drawDisc(ctx, cx, cy, MOON_CELLS, MOON_LV);
}

/* ------------------------------ stars ------------------------------ */
const STAR_COL = ["#ffffff", "#ffe9c4", "#cfe0ff"];
const STARS = (() => {
  let s = 7;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  return Array.from({ length: 220 }, () => ({
    fx: r(),
    fy: r(),
    big: r() < 0.08,
    a: 0.45 + 0.55 * r() ** 0.6, // brightness, so the field has depth
    tint: Math.floor(r() * 3), // 0 white, 1 warm, 2 cool
  }));
})();

/* -------------------------- shooting stars ------------------------- */
// A meteor is a fast head with a fading dotted tail. Positions are in cells,
// velocities in cells per second.
type Meteor = {
  x: number; // spawn point
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number; // seconds
  len: number; // tail length in dots
};

function spawnMeteor(cols: number): Meteor {
  const dir = Math.random() < 0.5 ? -1 : 1; // falls to the left or the right
  const angle = ((20 + Math.random() * 15) * Math.PI) / 180; // below horizontal
  const speed = 60 + Math.random() * 30;
  return {
    x: cols * (0.15 + Math.random() * 0.7),
    y: 2 + Math.random() * ROWS * 0.3,
    vx: dir * speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    age: 0,
    life: 0.8 + Math.random() * 0.4,
    len: 12,
  };
}

/* ------------------------------ birds ------------------------------ */
// Two small V-formation flocks that cross the sky by day. Wings alternate
// between two dotted poses.
const BIRD_UP = [-3, -2, -2, -1, -1, 0, 0, 0, 1, 0, 2, -1, 3, -2];
const BIRD_DN = [-3, 1, -2, 0, -1, 0, 0, 0, 1, 0, 2, 0, 3, 1];
const FLOCKS = [
  { x: 0.2, y: 16, v: 7, ph: 0 },
  { x: 0.75, y: 36, v: 5.5, ph: 2.1 },
];
const FORMATION = [0, 0, -7, 3, -7, -3];
const BIRD_COL = rgb("#33425a");

function birds(ctx: Ctx, cols: number, t: number, a: number) {
  if (a < 0.02) return;
  ctx.fillStyle = css(BIRD_COL);
  ctx.globalAlpha = a;
  const span = cols + 40;
  for (const f of FLOCKS)
    for (let i = 0; i < FORMATION.length; i += 2) {
      const x = Math.round(mod(f.x * cols + f.v * t + FORMATION[i], span) - 20);
      const y = Math.round(
        f.y + FORMATION[i + 1] + 1.5 * Math.sin(t * 0.7 + f.ph + i),
      );
      const pose = Math.sin(t * 5 + f.ph + i * 1.7) > 0 ? BIRD_UP : BIRD_DN;
      for (let j = 0; j < pose.length; j += 2)
        dot(ctx, x + pose[j], y + pose[j + 1]);
    }
  ctx.globalAlpha = 1;
}

/* ------------------------------ frame ------------------------------ */
export type Pointer = { x: number; y: number } | null; // in cells

export function createSky() {
  const shapes = SPECS.map(buildShape);
  const st: CloudState[] = SPECS.map(() => ({
    off: 0,
    glow: 0,
    rain: 0,
    rainOn: false,
    rainUntil: 0,
    bounce: 0,
    cx: 0,
    by: 0,
  }));
  let lastT = 0;
  let bodyGlow = 0; // 0 = resting (dim halo) .. 1 = hovering sun / moon
  let meteors: Meteor[] = [];
  let nextMeteor = 2; // time (s) of the next shooting star

  /**
   * e: 0 = day .. 1 = night (eased). toDay: true during the night -> day half
   * of the orbit. t, dt in seconds. Returns the clickable sun/moon disc.
   */
  function draw(
    ctx: Ctx,
    cols: number,
    e: number,
    t: number,
    dt: number,
    ptr: Pointer,
    toDay: boolean,
  ) {
    dt = Math.min(dt, 0.1);
    lastT = t;
    ctx.clearRect(0, 0, cols * P, ROWS * P);
    ctx.globalAlpha = 1;
    skyWash(ctx, cols * P, ROWS * P, e); // sunset / sunrise colours mid-swap
    const tick = Math.floor(t * 2);

    // stars
    const n = Math.round(clamp((e - 0.3) / 0.7) * STARS.length);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < n; i++) {
      if ((i * 7 + tick) % 13 === 0) continue; // twinkle
      const x = Math.floor(STARS[i].fx * cols),
        y = Math.floor(STARS[i].fy * (ROWS - 14));
      ctx.globalAlpha = STARS[i].a;
      ctx.fillStyle = STAR_COL[STARS[i].tint];
      dot(ctx, x, y);
      if (STARS[i].big) {
        dot(ctx, x - 1, y);
        dot(ctx, x + 1, y);
        dot(ctx, x, y - 1);
        dot(ctx, x, y + 1);
      }
    }
    ctx.globalAlpha = 1;

    // shooting stars (night only, drawn behind the clouds)
    if (e > 0.85 && t > nextMeteor && meteors.length < 2) {
      meteors.push(spawnMeteor(cols));
      nextMeteor = t + 3 + Math.random() * 5;
    }
    const visible = clamp((e - 0.7) / 0.3); // fades out as day returns
    ctx.fillStyle = "#ffffff";
    for (const m of meteors) {
      m.age += dt;
      const p = m.age / m.life;
      const fade = clamp(Math.min(p * 8, (1 - p) * 2.5)) * visible;
      const hx = m.x + m.vx * m.age,
        hy = m.y + m.vy * m.age;
      const speed = Math.hypot(m.vx, m.vy);
      const ux = m.vx / speed,
        uy = m.vy / speed;
      for (let i = 0; i < m.len; i++) {
        ctx.globalAlpha = fade * (1 - i / m.len) ** 1.5;
        dot(ctx, Math.round(hx - ux * i), Math.round(hy - uy * i));
      }
      ctx.globalAlpha = fade;
      dot(ctx, Math.round(hx) + 1, Math.round(hy)); // fatter head
      dot(ctx, Math.round(hx), Math.round(hy) + 1);
    }
    meteors = meteors.filter((m) => m.age < m.life);
    ctx.globalAlpha = 1;

    // sun and moon travel along a wide elliptical arc and slide off the left /
    // right edges of the screen. (Computed before the clouds so nearby clouds
    // can catch the sunlight.)
    const cx = Math.round(cols / 2);
    // Wide enough that the bodies slide off the left / right edges of the screen
    // (the +SUN_R+4 puts the arc's ends just past the edge) instead of dipping to a horizon.
    const A = cols * 0.5 + SUN_R + 4;
    const B = ARC_Y - CY; // vertical radius: how high the arc rises above its ends
    const at = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return {
        x: Math.round(cx + A * Math.cos(a)),
        y: Math.round(ARC_Y - B * Math.sin(a)),
      };
    };
    // Both swaps turn clockwise. Going to night: the sun sets on the right while
    // the moon rises from the left. Going back to day the moon carries on over
    // the top and sets on the right while the sun rises from the left. The
    // engine supplies `toDay` from a monotonic orbit counter, so the direction
    // is always right, even if you click mid-swap. The jump to the waiting
    // position happens while that body is invisible.
    const sunP = at(toDay ? 90 + e * SWEEP : 90 - e * SWEEP);
    const moonP = at(toDay ? 90 - (1 - e) * SWEEP : 90 + (1 - e) * SWEEP);
    // sunLow: the sun reddens as it sets. twilight: peaks mid-swap (both bodies
    // in the sky), warming the clouds.
    const sunLow = smooth(0.1, 0.6, e);
    const twilight = Math.sin(Math.PI * e);

    // clouds
    SPECS.forEach((sp, i) => {
      const sh = shapes[i],
        s = st[i];

      // where the cloud wants to be: drifting left to right, wrapping around
      // just off-screen so it re-enters from the left without a visible jump ...
      const left = -sh.maxX - 2,
        span = cols - sh.minX + 2 - left;
      const drift = left + mod(sp.x * cols + sp.v * t - left, span);
      const baseY = Math.round(
        sp.y * ROWS + 1.2 * Math.sin((2 * Math.PI * t) / sp.per + sp.ph),
      );

      // ... pushed away from the pointer (clouds part as you move through them)
      let target = 0;
      if (ptr) {
        const dx = drift - ptr.x,
          dy = (baseY - sp.h * 0.5 - ptr.y) * 1.4;
        const dist = Math.hypot(dx, dy),
          R = sp.w * 0.6 + 22;
        if (dist < R) target = (dx >= 0 ? 1 : -1) * (R - dist) * 0.5;
      }
      s.off += (target - s.off) * (1 - Math.exp(-dt * 4));
      s.bounce = Math.max(0, s.bounce - dt * 2.2);
      s.cx = Math.round(drift + s.off);
      s.by = baseY - Math.round(3 * Math.sin(Math.PI * s.bounce));

      // hover glow, rain easing
      const hovered =
        !!ptr && sh.has(Math.round(ptr.x) - s.cx, Math.round(ptr.y) - s.by);
      s.glow += ((hovered ? 1 : 0) - s.glow) * (1 - Math.exp(-dt * 8));
      if (s.rainOn && t > s.rainUntil) s.rainOn = false;
      s.rain += ((s.rainOn ? 1 : 0) - s.rain) * (1 - Math.exp(-dt * 2.5));

      // colours: day <-> night, brighter on hover, darker while raining
      const glowC = lerp3(GLOW_DAY, GLOW_NIGHT, e),
        rainC = lerp3(RAINY_DAY, RAINY_NIGHT, e);
      // clouds close to the sun pick up a warm edge light (day only)
      const prox = clamp(
        1 - Math.hypot(s.cx - sunP.x, s.by - sp.h * 0.5 - sunP.y) / 70,
      );
      const warm = prox * (1 - e) * 0.55;
      const dusk = twilight * 0.5; // clouds warm up during the swap
      // ... and pick up cool light from the moon at night
      const mprox = clamp(
        1 - Math.hypot(s.cx - moonP.x, s.by - sp.h * 0.5 - moonP.y) / 70,
      );
      const cool = mprox * e * 0.5;
      sh.tones.forEach((pts, k) => {
        let c = lerp3(CLOUD_DAY[k], CLOUD_NIGHT[k], e);
        if (k < 2) c = lerp3(c, SUNLIT, warm * (k === 0 ? 1 : 0.6));
        if (k < 3) c = lerp3(c, SUNSET, dusk * (k === 0 ? 1 : 0.7));
        if (k < 2) c = lerp3(c, MOONLIT, cool * (k === 0 ? 1 : 0.6));
        c = lerp3(c, glowC, s.glow * 0.45);
        if (k > 0) c = lerp3(c, rainC, s.rain * 0.55);
        ctx.fillStyle = css(c);
        // dotted style: small dots on the grid (same as halo / stars) instead of solid cells
        for (let j = 0; j < pts.length; j += 2)
          dot(ctx, s.cx + pts[j], s.by + pts[j + 1]);
      });

      // rain
      if (s.rain > 0.02) {
        ctx.fillStyle = css(lerp3(DROP_DAY, DROP_NIGHT, e));
        const width = sh.maxX - sh.minX - 12,
          count = Math.floor(width / 4.5);
        for (let k = 0; k < count; k++) {
          const hx = frac(Math.sin((k + 1) * 12.9898 + sp.seed) * 43758.5453);
          const hs = frac(Math.sin((k + 1) * 78.233 + sp.seed * 3.1) * 12543.1);
          if (hs > s.rain) continue;
          const ph = frac((t * (24 + hs * 16)) / RAIN_LEN + hs);
          const x = s.cx + sh.minX + 6 + Math.round(hx * width);
          const y = s.by + 2 + Math.round(ph * RAIN_LEN);
          ctx.globalAlpha = clamp((1 - ph) * 1.1);
          dot(ctx, x, y);
          dot(ctx, x, y + 1);
        }
        ctx.globalAlpha = 1;
      }
    });

    birds(ctx, cols, t, clamp(1 - e * 2.5)); // in front of the clouds so they stay visible

    // hovering whichever body is currently dominant brightens its halo
    const main = e < 0.5 ? sunP : moonP;
    const mainR = e < 0.5 ? SUN_R : MOON_R;
    const bodyHover =
      !!ptr && Math.hypot(ptr.x - main.x, ptr.y - main.y) <= mainR + 2;
    bodyGlow += ((bodyHover ? 1 : 0) - bodyGlow) * (1 - Math.exp(-dt * 8));
    // resting halo is dim, 1 = full on hover. The moon's halo is tight, so it can rest brighter.
    const sunK = 0.4 + 0.6 * bodyGlow;
    const moonK = 0.55 + 0.45 * bodyGlow;

    if (e < 1) {
      ctx.globalAlpha = clamp(1 - e * 1.15);
      drawSun(ctx, sunP.x, sunP.y, sunK, t, e < 0.5 ? bodyGlow : 0, sunLow);
    }
    if (e > 0) {
      ctx.globalAlpha = clamp(e * 1.15 - 0.15);
      drawMoon(ctx, moonP.x, moonP.y, moonK, t);
    }
    ctx.globalAlpha = 1;

    return { cx: main.x, cy: main.y, r: mainR };
  }

  /** index of the cloud under cell (x, y), or -1 */
  function cloudAt(x: number, y: number) {
    for (let i = shapes.length - 1; i >= 0; i--)
      if (shapes[i].has(Math.round(x) - st[i].cx, Math.round(y) - st[i].by))
        return i;
    return -1;
  }

  /** click: bounce the cloud and start / stop a rain shower */
  function toggleRain(i: number) {
    const s = st[i];
    s.rainOn = !s.rainOn;
    s.rainUntil = lastT + 8; // showers stop by themselves after 8 s
    s.bounce = 1;
  }

  return { draw, cloudAt, toggleRain };
}
