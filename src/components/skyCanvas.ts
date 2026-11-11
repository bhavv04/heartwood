/* Dithered pixel-art sky. Pure canvas drawing, no React. */

export const P = 4; // cell pitch (css px)
export const DOT = 2; // dither dot size (css px)
export const ROWS = 110; // sky height in cells (= 520px)

const MOON_R = 13;
const SUN_R = 14;
const HALO = 26; // halo thickness in cells
const CY = Math.round(ROWS * 0.446); // resting centre row of sun / moon (middle of the sky)
const HORIZON = Math.round(ROWS * 0.908); // row of the horizon the bodies rise / set on
const SWEEP = 100; // degrees travelled along the arc during a swap

type Ctx = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
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

/* ------------------------------ clouds ----------------------------- */
// Each cloud is a cluster of round puffs on a flat base, lit from the upper left.
// The shape is built once (dither pattern included); only colours / position /
// rain change per frame.
//   x = anchor (fraction of width)   y = base row (fraction of ROWS)
//   w, h = size in cells             amp / per / ph = gentle idle sway
const SPECS = [
  { x: 0.1, y: 0.2, w: 20, h: 10, amp: 8, per: 55, ph: 0.0, seed: 11 },
  { x: 0.3, y: 0.14, w: 24, h: 12, amp: 10, per: 62, ph: 1.1, seed: 23 },
  { x: 0.62, y: 0.2, w: 22, h: 11, amp: 9, per: 58, ph: 2.4, seed: 29 },
  { x: 0.86, y: 0.3, w: 30, h: 14, amp: 10, per: 65, ph: 1.5, seed: 31 },
  { x: 0.2, y: 0.45, w: 26, h: 13, amp: 9, per: 52, ph: 4.0, seed: 43 },
  { x: 0.5, y: 0.5, w: 18, h: 9, amp: 12, per: 48, ph: 0.4, seed: 47 },
  { x: 0.76, y: 0.55, w: 28, h: 13, amp: 9, per: 60, ph: 3.3, seed: 53 },
  { x: 0.12, y: 0.7, w: 40, h: 20, amp: 10, per: 70, ph: 3.0, seed: 37 },
  { x: 0.4, y: 0.78, w: 22, h: 11, amp: 14, per: 50, ph: 2.0, seed: 59 },
  { x: 0.68, y: 0.82, w: 36, h: 17, amp: 10, per: 60, ph: 0.7, seed: 41 },
  { x: 0.92, y: 0.76, w: 24, h: 12, amp: 8, per: 56, ph: 5.1, seed: 61 },
];

type Spec = (typeof SPECS)[number];
type Shape = {
  tones: number[][]; // [highlight, body, shadow] -> flat [x, y, x, y ...] relative to the base centre
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
  const n = Math.max(3, Math.round(sp.w / 15));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const bell = Math.sin(Math.PI * t) ** 0.8; // taller in the middle
    const r = sp.h * (0.3 + 0.4 * bell) * (0.85 + 0.3 * rnd());
    puffs.push([(t - 0.5) * sp.w, -r * 0.55, r]);
  }
  puffs.push([(rnd() - 0.5) * sp.w * 0.3, -sp.h * 0.5, sp.h * 0.5]); // crown
  puffs.push([(rnd() - 0.5) * sp.w * 0.5, -sp.h * 0.4, sp.h * 0.38]);

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

  const tones: number[][] = [[], [], []];
  for (let iy = 0; iy < H; iy++)
    for (let ix = 0; ix < W; ix++) {
      if (!inside(ix, iy)) continue;
      const lx = ix + minX,
        ly = iy + minY;
      const b = bm[iy][ix];
      const rim = !inside(ix, iy - 1); // bright outline along the top edge
      const tone = rim || b > 0.62 ? 0 : b > 0.3 ? 1 : 2;
      let dens = tone === 0 ? 0.92 : tone === 1 ? 0.7 : 0.5;
      dens *= 0.3 + 0.7 * clamp(-ly / (0.25 * sp.h)); // base fades out
      if (rim || bay(lx, ly) < dens) tones[tone].push(lx, ly);
    }

  return {
    tones,
    minX,
    maxX,
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

const rgb = (h: string) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp3 = (a: number[], b: number[], t: number) =>
  a.map((v, i) => v + (b[i] - v) * t);
const css = (c: number[]) => `rgb(${c.map((v) => Math.round(v)).join(",")})`;
const frac = (v: number) => v - Math.floor(v);

// [highlight, body, shadow]  (dimmed)
const CLOUD_DAY = ["#ece4d8", "#d9c9b4", "#a89279"].map(rgb);
const CLOUD_NIGHT = ["#6a6a74", "#4e4e58", "#2c2c34"].map(rgb);
const GLOW_DAY = rgb("#f4f0ea"),
  GLOW_NIGHT = rgb("#b0b0bc");
const RAINY_DAY = rgb("#a9acb4"),
  RAINY_NIGHT = rgb("#3c3c47");
const DROP_DAY = rgb("#8fb2cc"),
  DROP_NIGHT = rgb("#8c97ad");
const RAIN_LEN = 26; // rows a drop falls

/* ------------------------------ bodies ----------------------------- */
// k = halo intensity: dim at rest, 1 when hovering the sun / moon
function halo(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  color: string,
  k: number,
) {
  const R = r + HALO;
  ctx.fillStyle = color;
  for (let y = cy - R; y <= cy + R; y++)
    for (let x = cx - R; x <= cx + R; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r || d > R || y < 0 || y >= ROWS) continue;
      const tt = (d - r) / (R - r);
      if (bay(x, y) < 0.75 * k * (1 - tt) ** 1.6) dot(ctx, x, y);
    }
}

const SUN_LV = ["#e9d68a", "#f1e1a0", "#f7eab8", "#fcf4d2", "#fffdf0"];
function drawSun(ctx: Ctx, cx: number, cy: number, k: number) {
  halo(ctx, cx, cy, SUN_R, "#ffe08a", k);
  const buckets: number[][] = SUN_LV.map(() => []);
  for (let y = cy - SUN_R; y <= cy + SUN_R; y++)
    for (let x = cx - SUN_R; x <= cx + SUN_R; x++) {
      const u = (x - cx) / SUN_R,
        v = (y - cy) / SUN_R,
        d2 = u * u + v * v;
      if (d2 > 1 || y < 0 || y >= ROWS) continue;
      const b = Math.max(0, -0.35 * u - 0.35 * v + 0.85 * Math.sqrt(1 - d2));
      buckets[clamp(Math.floor(b * 5), 0, 4)].push(x, y);
    }
  // little nubs at the cardinal points
  buckets[0].push(
    cx,
    cy - SUN_R - 1,
    cx,
    cy + SUN_R + 1,
    cx - SUN_R - 1,
    cy,
    cx + SUN_R + 1,
    cy,
  );
  buckets.forEach((arr, i) => {
    ctx.fillStyle = SUN_LV[i];
    for (let j = 0; j < arr.length; j += 2) cell(ctx, arr[j], arr[j + 1]);
  });
}

const MOON_LV = [
  "#2c2c2c",
  "#555555",
  "#7f7f7f",
  "#a8a8a8",
  "#d0d0d0",
  "#f2f2f2",
];
const CRATERS = [
  [-0.35, -0.4, 0.2],
  [0.3, -0.15, 0.26],
  [-0.05, 0.4, 0.24],
  [0.45, 0.4, 0.17],
  [-0.55, 0.12, 0.13],
];
function drawMoon(ctx: Ctx, cx: number, cy: number, k: number) {
  halo(ctx, cx, cy, MOON_R, "#d4d4d4", k);
  const buckets: number[][] = MOON_LV.map(() => []);
  for (let y = cy - MOON_R; y <= cy + MOON_R; y++)
    for (let x = cx - MOON_R; x <= cx + MOON_R; x++) {
      const u = (x - cx) / MOON_R,
        v = (y - cy) / MOON_R,
        d2 = u * u + v * v;
      if (d2 > 1 || y < 0 || y >= ROWS) continue;
      let b =
        Math.max(0, -0.45 * u - 0.45 * v + 0.77 * Math.sqrt(1 - d2)) * 1.25;
      for (const [cu, cv, cr] of CRATERS)
        if ((u - cu) ** 2 + (v - cv) ** 2 < cr * cr) b *= 0.55;
      buckets[clamp(Math.floor(b * 6), 0, 5)].push(x, y);
    }
  buckets.forEach((arr, i) => {
    ctx.fillStyle = MOON_LV[i];
    for (let j = 0; j < arr.length; j += 2) cell(ctx, arr[j], arr[j + 1]);
  });
}

/* ------------------------------ stars ------------------------------ */
const STARS = (() => {
  let s = 7;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  return Array.from({ length: 220 }, () => ({
    fx: r(),
    fy: r(),
    big: r() < 0.08,
  }));
})();

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

  /** e: 0 = day .. 1 = night (eased). t, dt in seconds. Returns the clickable sun/moon disc. */
  function draw(
    ctx: Ctx,
    cols: number,
    e: number,
    t: number,
    dt: number,
    ptr: Pointer,
  ) {
    lastT = t;
    ctx.clearRect(0, 0, cols * P, ROWS * P);
    ctx.globalAlpha = 1;
    const tick = Math.floor(t * 2);

    // stars
    const n = Math.round(clamp((e - 0.3) / 0.7) * STARS.length);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < n; i++) {
      if ((i * 7 + tick) % 13 === 0) continue; // twinkle
      const x = Math.floor(STARS[i].fx * cols),
        y = Math.floor(STARS[i].fy * (ROWS - 14));
      dot(ctx, x, y);
      if (STARS[i].big) {
        dot(ctx, x - 1, y);
        dot(ctx, x + 1, y);
        dot(ctx, x, y - 1);
        dot(ctx, x, y + 1);
      }
    }

    // clouds
    SPECS.forEach((sp, i) => {
      const sh = shapes[i],
        s = st[i];

      // where the cloud wants to be: idle sway ...
      const sway =
        sp.x * cols + sp.amp * Math.sin((2 * Math.PI * t) / sp.per + sp.ph);
      const baseY = Math.round(sp.y * ROWS);

      // ... pushed away from the pointer (clouds part as you move through them)
      let target = 0;
      if (ptr) {
        const dx = sway - ptr.x,
          dy = (baseY - sp.h * 0.5 - ptr.y) * 1.4;
        const dist = Math.hypot(dx, dy),
          R = sp.w * 0.6 + 22;
        if (dist < R) target = (dx >= 0 ? 1 : -1) * (R - dist) * 0.5;
      }
      s.off += (target - s.off) * (1 - Math.exp(-dt * 4));
      s.bounce = Math.max(0, s.bounce - dt * 2.2);
      s.cx = Math.round(clamp(sway + s.off, 2 - sh.minX, cols - sh.maxX - 2)); // always fully on screen
      s.by = baseY - Math.round(3 * Math.sin(Math.PI * s.bounce));

      // hover glow, rain easing
      const hovered =
        !!ptr && sh.has(Math.round(ptr.x) - s.cx, Math.round(ptr.y) - s.by);
      s.glow += ((hovered ? 1 : 0) - s.glow) * (1 - Math.exp(-dt * 8));
      if (s.rainOn && t > s.rainUntil) s.rainOn = false;
      s.rain += ((s.rainOn ? 1 : 0) - s.rain) * (1 - Math.exp(-dt * 2.5));

      // colours: day <-> night, brighter on hover, greyer while raining
      const glowC = lerp3(GLOW_DAY, GLOW_NIGHT, e),
        rainC = lerp3(RAINY_DAY, RAINY_NIGHT, e);
      sh.tones.forEach((pts, k) => {
        let c = lerp3(CLOUD_DAY[k], CLOUD_NIGHT[k], e);
        c = lerp3(c, glowC, s.glow * 0.55);
        if (k > 0) c = lerp3(c, rainC, s.rain * 0.5);
        ctx.fillStyle = css(c);
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

    // sun and moon travel along an elliptical arc: the sun sets over the right
    // horizon while the moon rises from the left and climbs to the top
    const cx = Math.round(cols / 2);
    const A = Math.min(cols * 0.42, 170); // horizontal radius of the orbit
    const B = HORIZON - CY; // vertical radius of the orbit
    const at = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return {
        x: Math.round(cx + A * Math.cos(a)),
        y: Math.round(HORIZON - B * Math.sin(a)),
      };
    };
    const sunP = at(90 - e * SWEEP);
    const moonP = at(90 + (1 - e) * SWEEP);

    // hovering whichever body is currently dominant brightens its halo
    const main = e < 0.5 ? sunP : moonP;
    const mainR = e < 0.5 ? SUN_R : MOON_R;
    const bodyHover =
      !!ptr && Math.hypot(ptr.x - main.x, ptr.y - main.y) <= mainR + 2;
    bodyGlow += ((bodyHover ? 1 : 0) - bodyGlow) * (1 - Math.exp(-dt * 8));
    const k = 0.3 + 0.7 * bodyGlow; // 0.3 = dim resting halo, 1 = full on hover

    if (e < 1) {
      ctx.globalAlpha = clamp(1 - e * 1.15);
      drawSun(ctx, sunP.x, sunP.y, k);
    }
    if (e > 0) {
      ctx.globalAlpha = clamp(e * 1.15 - 0.15);
      drawMoon(ctx, moonP.x, moonP.y, k);
    }
    ctx.globalAlpha = 1;

    return { cx, cy: CY, r: e < 0.5 ? SUN_R : MOON_R };
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
