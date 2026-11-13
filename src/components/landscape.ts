/* Dithered pixel-art footer scene: layered mountains, mist, a dense pine forest
   and grass. Birds hide inside the trees until you click one, then they burst
   out of the foliage and fly off.
   Pure canvas drawing, no React. Uses the same cell / dot grid as the sky. */

export const P = 4; // cell pitch (css px)
export const DOT = 2; // dither dot size (css px)
export const ROWS = 60; // scene height in cells (= 240px)

const GROUND = 51; // first row of the ground band

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

const rgb = (h: string) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp3 = (a: number[], b: number[], t: number) =>
  a.map((v, i) => v + (b[i] - v) * t);
const css = (c: number[]) => `rgb(${c.map((v) => Math.round(v)).join(",")})`;

// seeded random numbers, so the scene looks the same on every load
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

// 1D value noise
const hash = (n: number, seed: number) => {
  let s = (n * 374761393 + seed * 668265263) | 0;
  s = Math.imul(s ^ (s >>> 13), 1274126177);
  return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const vnoise = (x: number, seed: number) => {
  const i = Math.floor(x),
    f = x - i;
  return hash(i, seed) + (hash(i + 1, seed) - hash(i, seed)) * smooth(f);
};

/* ------------------------------ terrain ---------------------------- */
// Three mountain ranges (far -> near) plus a dense ground band, all in one
// monochrome dot-matrix style: a regular grid of dots with a few left out.
//   - the ridge line itself is the darkest (night: brightest) row of dots
//   - slopes facing the light (upper left) are lighter, with diagonal gullies
//     running down them so the rock looks faceted
//   - dots are a little sparser near the tips and thicker lower down
//   - a thin band of mist sits in each valley, so the ranges separate in depth
type Layer = {
  base: number; // row of the valleys
  rise: number; // how many rows the tallest peaks climb above the valleys
  gap: number; // average distance between peaks, in cells
  seed: number;
  dens: number; // dot density
  snow?: number; // snow starts this fraction of `rise` above the valleys; only
  //               peaks tall enough to reach it get a cap (none = no snow)
  extra?: number[][]; // feature peaks: [x as a fraction of the width, height, steepness]
};
const LAYERS: Layer[] = [
  {
    base: 47,
    rise: 46,
    gap: 82,
    seed: 3,
    dens: 0.8,
    snow: 0.55,
    extra: [
      [0.27, 43, 0.8],
      [0.74, 45, 0.75],
    ],
  },
  {
    base: 49,
    rise: 28,
    gap: 44,
    seed: 9,
    dens: 0.85,
    snow: 0.72,
    extra: [[0.5, 29, 0.95]],
  },
  { base: 51, rise: 12, gap: 24, seed: 21, dens: 0.9 },
];
const GROUND_DENS = 0.7;
const MIST_H = 9; // rows of mist above each nearer range's valley floor

// A skyline is a row of triangular peaks (random heights and steepness) joined
// where they meet, with fine noise on top so the slopes look rocky and jagged.
function buildRidge(cols: number, L: Layer) {
  const rnd = rng(L.seed);
  const peaks: number[][] = []; // [x, height, steepness]
  for (let x = -L.gap; x < cols + L.gap; x += L.gap * (0.6 + 0.8 * rnd()))
    peaks.push([x, L.rise * (0.4 + 0.6 * rnd()), 0.6 + 0.5 * rnd()]);
  for (const [fx, h, sp] of L.extra ?? []) peaks.push([fx * cols, h, sp]);
  const out = new Int16Array(cols + 8);
  for (let i = 0; i < cols + 8; i++) {
    const x = i - 4;
    let v = 0;
    for (const [px, ph, sp] of peaks)
      v = Math.max(v, ph - Math.abs(x - px) * sp);
    v +=
      (vnoise(x * 0.3, L.seed + 1) - 0.5) * 4 +
      (vnoise(x * 0.09, L.seed + 2) - 0.5) * 5;
    out[i] = Math.max(2, Math.round(L.base - Math.max(0, v)));
  }
  return out;
}

// colour buckets: [far lit, far shade, mid lit, mid shade, foothills lit,
//                  foothills shade, ridge line, ground, mist, path,
//                  snow lit, snow shade]
// Kept dim on purpose: nothing in the scene goes anywhere near white, apart
// from the snow caps, which are the lightest thing on the mountains.
const TERRAIN_DAY = [
  "#747474",
  "#4c4c4c",
  "#575757",
  "#2e2e2e",
  "#3a3a3a",
  "#1e1e1e",
  "#111111",
  "#2a2a2a",
  "#6a6a6a",
  "#6c6c6c",
  "#b8b8b8",
  "#8c8c8c",
].map(rgb);
const TERRAIN_NIGHT = [
  "#404040",
  "#2c2c2c",
  "#585858",
  "#3a3a3a",
  "#727272",
  "#505050",
  "#8c8c8c",
  "#5c5c5c",
  "#4a4a4a",
  "#8c8c8c",
  "#d0d0d0",
  "#9a9a9a",
].map(rgb);

/* ------------------------------ trees ------------------------------ */
// [highlight, light, body, shadow]
const TREE_DAY = ["#848484", "#686868", "#4c4c4c", "#303030"].map(rgb);
const TREE_NIGHT = ["#6e6e6e", "#545454", "#3a3a3a", "#222222"].map(rgb);
// far trees fade toward this, which gives the forest some depth
const FOG_DAY = rgb("#5c5c5c");
const FOG_NIGHT = rgb("#4a4a4a");
// share of dots kept per tone: highlights are the sparsest, so the foliage
// reads as a stipple of dots rather than a solid mass
const TREE_DENS = [0.6, 0.78, 0.92, 1];

type Nest = { dx: number; dy: number }; // a spot inside the foliage, relative to (cx, by)
type Tree = {
  cx: number; // trunk column
  by: number; // base row (bottom of the trunk)
  h: number; // foliage height in rows
  fog: number; // 0 = near, 1 = far
  tones: number[][]; // flat [x, y, ...] per tone, relative to (cx, by)
  keys: Set<number>; // occupied cells, for hit-testing
  nests: Nest[]; // where hidden birds sit
  shake: number; // 1 right after a click, decays to 0
  glow: number; // hover
};
const keyOf = (x: number, y: number) => (y + 64) * 64 + (x + 32);

// A pine is a stack of overlapping tiers. Each tier has a ragged edge (left and
// right jitter independently), drooping tips on its lowest row, and is lit from
// the left with a shadowed underside, so the tree looks layered and a bit wind-worn.
function buildTree(
  cx: number,
  by: number,
  h: number,
  rnd: () => number,
  slim: number,
  fog: number,
): Tree {
  const cells = new Map<number, number>();
  const tiers = Math.max(4, Math.round(h / 3.6));
  const th = Math.round(h * 0.34 + 2); // tier height
  const step = (h - th) / (tiers - 1);
  const top0 = -(h + 3);

  for (let i = 0; i < tiers; i++) {
    const top = Math.round(top0 + i * step);
    const hwMax = slim * h * (0.1 + 0.2 * (i / (tiers - 1)) ** 0.85) + 1;
    for (let j = 0; j < th; j++) {
      const y = top + j;
      const hw = Math.max(0.4, (hwMax * (j + 1)) / th);
      let wl = Math.floor(hw + rnd() * 0.9),
        wr = Math.floor(hw + rnd() * 0.9);
      if (j === th - 1) {
        // drooping branch tips
        wl += rnd() < 0.6 ? 1 : 0;
        wr += rnd() < 0.6 ? 1 : 0;
      }
      for (let x = -wl; x <= wr; x++) {
        // lit from the left, darker to the right and on each tier's underside
        let f = (x / Math.max(hw, 1) + 1) * 1.05 + 0.15 + (j / th) * 0.45;
        f += (rnd() - 0.5) * 0.3;
        if (j >= th - 2) f += j === th - 1 ? 1 : 0.5;
        const tone = clamp(
          Math.floor(f) + (bay(x, y) < f - Math.floor(f) ? 1 : 0),
          0,
          3,
        );
        cells.set(keyOf(x, y), tone);
      }
    }
  }

  // trunk with a small root flare
  for (let y = -3; y <= 0; y++) {
    cells.set(keyOf(-1, y), 2);
    cells.set(keyOf(0, y), 3);
  }
  cells.set(keyOf(-2, 0), 2);
  cells.set(keyOf(1, 0), 3);

  const tones: number[][] = [[], [], [], []];
  const foliage: Nest[] = [];
  cells.forEach((tone, k) => {
    const x = (k % 64) - 32,
      y = Math.floor(k / 64) - 64;
    tones[tone].push(x, y);
    if (y < -4) foliage.push({ dx: x, dy: y }); // inside the crown, not the trunk
  });
  // a few random spots inside the crown for the hidden birds
  const nests: Nest[] = [];
  for (let i = 0; i < 3 && foliage.length; i++)
    nests.push(foliage[Math.floor(rnd() * foliage.length)]);

  return {
    cx,
    by,
    h,
    fog,
    tones,
    keys: new Set(cells.keys()),
    nests,
    shake: 0,
    glow: 0,
  };
}

/* ------------------------------ birds ------------------------------ */
const BIRD_UP = ["#.....#", ".#...#.", "..###.."];
const BIRD_DOWN = ["..###..", ".#...#.", "#.....#"];
const BIRD_DAY = rgb("#161616");
const BIRD_NIGHT = rgb("#a8a8a8");
const RETURN_AFTER = 16; // seconds until a gone bird is back in its tree

// hidden: inside a tree, not drawn. flee: flying away. gone: off screen, will
// slip back into its tree after a while so the trees can be clicked again.
type BirdState = "hidden" | "flee" | "gone";
type Bird = {
  tree: number;
  nest: Nest;
  state: BirdState;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number;
  phase: number;
  scareAt: number; // time the bird bursts out (0 = not startled)
  returnAt: number; // time the bird is back in the tree (0 = n/a)
};

function sprite(
  ctx: Ctx,
  rows: string[],
  x0: number,
  y0: number,
  flip: boolean,
) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++)
      if (row[flip ? row.length - 1 - i : i] === "#") cell(ctx, x0 + i, y0 + j);
  });
}

/* ------------------------------ grass ------------------------------ */
// A strip of blades along the bottom edge, drawn in front of the trees. They
// sway in a travelling wind with the odd stronger gust, and bend away from the
// pointer.
type Blade = {
  x: number;
  h: number; // height in cells
  lean: number; // resting lean
  phase: number;
  push: number; // eased bend away from the pointer
  base: number; // row the blade grows from
  layer: 0 | 1 | 2; // 0 = rearmost (hazy), 1 = middle, 2 = front
};
const GRASS_BASE = ROWS - 1; // bottom row
const GRASS_DAY = ["#222222", "#505050"].map(rgb); // [stem, tip]
const GRASS_NIGHT = ["#626262", "#8e8e8e"].map(rgb);
// middle layer: lighter / hazier than the front, so it sits further away
const GRASS_BACK_DAY = ["#3c3c3c", "#707070"].map(rgb);
const GRASS_BACK_NIGHT = ["#484848", "#6c6c6c"].map(rgb);
// rearmost layer: the haziest of all
const GRASS_MID_DAY = ["#505050", "#808080"].map(rgb);
const GRASS_MID_NIGHT = ["#3a3a3a", "#5a5a5a"].map(rgb);

/* ------------------------------ scene ------------------------------ */
export type Pointer = { x: number; y: number } | null; // in cells

export function createLandscape() {
  let buckets: number[][] = [];
  let trees: Tree[] = [];
  let blades: Blade[] = [];
  let birds: Bird[] = [];
  let lastT = 0;
  let reduced = false;

  /** Build everything for a canvas `cols` cells wide. Call again on resize. */
  function layout(cols: number) {
    /* mountains */
    buckets = Array.from({ length: 12 }, () => []);
    const ridges = LAYERS.map((L) => buildRidge(cols, L));
    // An empty dirt path: it climbs from the bottom edge towards the horizon,
    // narrowing and winding a little. No trees or grass grow on it.
    const pathTop = GROUND - 1;
    const pcx = Math.round(cols * 0.64);
    const pathT = (y: number) => clamp((y - pathTop) / (ROWS - 1 - pathTop));
    const pathC = (y: number) =>
      pcx + Math.sin((y - pathTop) * 0.45) * 3 + (y - pathTop) * 0.35;
    const pathHw = (y: number) => 2.2 + pathT(y) * 9;
    const onPath = (x: number, y: number, margin = 0) =>
      Math.abs(x - pathC(y)) < pathHw(y) + margin;
    const ground = new Int16Array(cols);
    for (let x = 0; x < cols; x++)
      ground[x] = GROUND - 1 + Math.round(2 * vnoise(x * 0.05, 77));

    for (let x = 0; x < cols; x++) {
      const i = x + 4;
      const g = ground[x];
      const rs = ridges.map((a) => a[i]);
      for (let y = Math.min(...rs); y < ROWS; y++) {
        // ground band
        if (y >= g) {
          if (onPath(x, y)) {
            const soft = clamp(
              (pathHw(y) - Math.abs(x - pathC(y))) / 1.5 + 0.4,
            );
            const pd =
              0.93 * soft * (0.85 + 0.3 * vnoise((x + y * 0.6) * 0.3, 83));
            if (bay(x, y) < pd) buckets[9].push(x, y);
            continue;
          }
          const d = GROUND_DENS * (0.8 + 0.4 * vnoise((x * 0.5 + y) * 0.2, 41));
          if (bay(x, y) < d) buckets[7].push(x, y);
          continue;
        }
        // frontmost range that covers this cell
        let layer = -1;
        for (let l = LAYERS.length - 1; l >= 0; l--)
          if (y >= rs[l]) {
            layer = l;
            break;
          }
        if (layer < 0) continue;

        const L = LAYERS[layer],
          rr = rs[layer];
        if (y === rr) {
          buckets[6].push(x, y); // the ridge line: a full row of dots
          continue;
        }

        // mist: hangs over the farther ranges just above the next range's valleys
        if (layer < LAYERS.length - 1) {
          const top = LAYERS[layer + 1].base - MIST_H;
          if (y >= top) {
            const fade = (y - top) / MIST_H;
            const md =
              0.5 * fade * (0.6 + 0.8 * vnoise(x * 0.07 + y * 0.3, 60 + layer));
            if (bay(x + 2, y + 1) < md) {
              buckets[8].push(x, y);
              continue;
            }
          }
        }

        const slope = ridges[layer][i - 2] - ridges[layer][i + 2];
        const sign = slope > 0 ? 1 : -1;
        // gullies: diagonal streaks running down the slope, shaded like the far face
        const gully =
          vnoise((x - sign * (y - rr) * 0.7) * 0.4, L.seed + 40) > 0.66;
        const lit = slope > 0 && !gully; // light comes from the upper left
        // snow caps: above a ragged snow line, with bare streaks running down
        // through it wherever there is a gully
        if (L.snow !== undefined) {
          const line =
            L.base - L.rise * L.snow + (vnoise(x * 0.3, L.seed + 70) - 0.5) * 5;
          if (y < line && !(gully && y - rr > 3)) {
            if (bay(x, y) < 0.95) buckets[slope > 0 ? 10 : 11].push(x, y);
            continue;
          }
        }
        const d =
          L.dens *
          (0.7 + 0.3 * clamp((y - rr) / 10)) *
          (lit ? 1 : 0.92) *
          (0.85 + 0.3 * vnoise((x + y * 0.7) * 0.12, 5 + layer));
        if (bay(x, y) < d) buckets[layer * 2 + (lit ? 0 : 1)].push(x, y);
      }
    }

    /* trees: a dense forest, many small far trees and fewer big near ones */
    const rnd = rng(12345);
    const n = clamp(Math.round(cols / 4.2), 30, 130);
    trees = [];
    for (let i = 0; i < n; i++) {
      const slot = cols / n;
      const cx = Math.round((i + 0.5) * slot + (rnd() - 0.5) * slot * 1.6);
      const depth = Math.floor(rnd() ** 1.3 * 7); // 0 = far, 6 = near
      const by = GROUND + 2 + depth;
      const h = Math.round(9 + depth * 2.7 + rnd() * 4);
      const slim = 0.75 + rnd() * 0.55;
      const tr = buildTree(cx, by, h, rnd, slim, 1 - depth / 6);
      if (onPath(cx, by, 3)) continue; // keep the path clear
      trees.push(tr);
    }
    trees.sort((a, b) => a.by - b.by || a.cx - b.cx); // far trees first

    /* birds: hidden in the foliage, one to three per tree, until a tree is clicked */
    birds = [];
    trees.forEach((tr, ti) => {
      if (rnd() < 0.25) return; // a few empty trees
      const k = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < k && j < tr.nests.length; j++)
        birds.push({
          tree: ti,
          nest: tr.nests[j],
          state: "hidden",
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          dir: 1,
          phase: rnd() * 6.28,
          scareAt: 0,
          returnAt: 0,
        });
    });

    /* grass: three layers, rooted a couple of rows apart. A blade in most
       columns, mostly short with a few tall ones; the path stays bare apart
       from the odd short tuft. */
    blades = [];
    const addLayer = (
      layer: 0 | 1 | 2,
      base: number,
      skip: number,
      minH: number,
      span: number,
      pow: number,
    ) => {
      for (let x = 0; x < cols; x++) {
        if (rnd() < skip) continue;
        const onP = onPath(x, base, -0.5);
        if (onP && rnd() > 0.06) continue;
        blades.push({
          x,
          h: onP
            ? 1 + Math.floor(rnd() * 2)
            : minH + Math.floor(rnd() ** pow * span),
          lean: (rnd() - 0.5) * 2,
          phase: rnd() * 6.28,
          push: 0,
          base,
          layer,
        });
      }
    };
    addLayer(0, GRASS_BASE - 4, 0.55, 3, 9, 1.6); // rearmost, hazy
    addLayer(1, GRASS_BASE - 2, 0.4, 4, 10, 1.6); // middle
    addLayer(2, GRASS_BASE, 0.3, 2, 9, 1.8); // front
  }

  /** Mountains + ground. Static, so the caller can draw it once into an offscreen canvas. */
  function drawTerrain(ctx: Ctx, e: number) {
    ctx.globalAlpha = 1;
    buckets.forEach((pts, i) => {
      ctx.fillStyle = css(lerp3(TERRAIN_DAY[i], TERRAIN_NIGHT[i], e));
      for (let j = 0; j < pts.length; j += 2) dot(ctx, pts[j], pts[j + 1]);
    });
  }

  const sway = (tr: Tree, relY: number, t: number) =>
    Math.round(
      tr.shake * Math.sin(t * 26 + tr.cx) * 2.4 * clamp(-relY / (tr.h + 3)),
    );
  const hit = (tr: Tree, x: number, y: number) => {
    const lx = Math.round(x) - tr.cx,
      ly = Math.round(y) - tr.by;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (tr.keys.has(keyOf(lx + dx, ly + dy))) return true;
    return false;
  };
  /** index of the front-most tree under cell (x, y), or -1 */
  function treeAt(x: number, y: number) {
    for (let i = trees.length - 1; i >= 0; i--)
      if (hit(trees[i], x, y)) return i;
    return -1;
  }

  /** Trees and birds. Returns true while something is still animating. */
  function draw(
    ctx: Ctx,
    cols: number,
    e: number,
    t: number,
    dt: number,
    ptr: Pointer,
  ): boolean {
    lastT = t;
    let busy = false;
    ctx.globalAlpha = 1;

    /* trees: only the front-most tree under the pointer lights up */
    const hover = ptr ? treeAt(ptr.x, ptr.y) : -1;
    const base = TREE_DAY.map((c, k) => lerp3(c, TREE_NIGHT[k], e));
    const fog = lerp3(FOG_DAY, FOG_NIGHT, e);
    trees.forEach((tr, ti) => {
      const hovered = ti === hover;
      tr.glow += ((hovered ? 1 : 0) - tr.glow) * (1 - Math.exp(-dt * 8));
      tr.shake = Math.max(0, tr.shake - dt * 1.6);
      busy ||= tr.shake > 0.01 || (hovered ? tr.glow < 0.99 : tr.glow > 0.01);

      tr.tones.forEach((pts, k) => {
        const c = lerp3(base[k], fog, tr.fog * 0.4);
        ctx.fillStyle = css(lerp3(c, [200, 200, 200], tr.glow * 0.12));
        const keep = TREE_DENS[k];
        for (let j = 0; j < pts.length; j += 2) {
          if (bay(pts[j] + 1, pts[j + 1]) >= keep) continue;
          dot(
            ctx,
            tr.cx + pts[j] + sway(tr, pts[j + 1], t),
            tr.by + pts[j + 1],
          );
        }
      });
    });

    /* birds: invisible inside their tree until it is clicked, then they burst
       out of the foliage, fly off, and (much later) slip back in */
    ctx.fillStyle = css(lerp3(BIRD_DAY, BIRD_NIGHT, e));
    for (const b of birds) {
      if (b.state === "hidden") {
        if (!b.scareAt || t < b.scareAt) {
          busy ||= b.scareAt > 0;
          continue;
        }
        const tr = trees[b.tree];
        b.state = "flee";
        b.scareAt = 0;
        b.x = tr.cx + b.nest.dx + sway(tr, b.nest.dy, t);
        b.y = tr.by + b.nest.dy;
        b.dir = Math.random() < 0.5 ? -1 : 1;
        b.vx = b.dir * (6 + Math.random() * 14);
        b.vy = -(14 + Math.random() * 12);
      } else if (b.state === "gone") {
        if (b.returnAt && t >= b.returnAt) {
          b.state = "hidden";
          b.returnAt = 0;
        }
        continue;
      }

      busy = true;
      b.vx = clamp(b.vx + b.dir * 22 * dt, -34, 34);
      b.vy += (-8 - b.vy) * dt * 1.5; // settle into a gentle climb
      b.x += b.vx * dt;
      b.y += b.vy * dt + Math.sin(t * 9 + b.phase) * 0.12;
      if (b.y < -6 || b.x < -8 || b.x > cols + 8) {
        b.state = "gone";
        b.returnAt = t + RETURN_AFTER + Math.random() * 10;
        continue;
      }
      const frame = Math.floor(t * 10 + b.phase) & 1 ? BIRD_UP : BIRD_DOWN;
      sprite(ctx, frame, Math.round(b.x) - 3, Math.round(b.y) - 1, false);
    }

    /* grass, in front of everything */
    const tw = reduced ? 0 : t; // no wind with reduced motion
    const bend = new Float32Array(blades.length);
    blades.forEach((bl, i) => {
      const wind =
        Math.sin(bl.x * 0.07 - tw * 2.0) * 0.6 +
        Math.sin(bl.x * 0.19 - tw * 3.1 + bl.phase) * 0.25 +
        Math.sin(bl.x * 0.02 - tw * 0.6) ** 2 * 0.5; // slow gusts roll across
      const dx = bl.x - (ptr ? ptr.x : 1e9);
      const target =
        !reduced && ptr && ptr.y > GRASS_BASE - 14 && Math.abs(dx) < 10
          ? Math.sign(dx) * (10 - Math.abs(dx)) * 0.45
          : 0;
      bl.push += (target - bl.push) * (1 - Math.exp(-dt * 10));
      bend[i] = bl.lean * 1.2 + wind * (0.7 + bl.h * 0.1) + bl.push;
    });
    const grassCols = [
      GRASS_MID_DAY.map((c, k) => lerp3(c, GRASS_MID_NIGHT[k], e)),
      GRASS_BACK_DAY.map((c, k) => lerp3(c, GRASS_BACK_NIGHT[k], e)),
      GRASS_DAY.map((c, k) => lerp3(c, GRASS_NIGHT[k], e)),
    ];
    // rearmost layer first so the nearer blades overlap it
    for (const layer of [0, 1, 2]) {
      const grass = grassCols[layer];
      for (let tone = 0; tone < 2; tone++) {
        ctx.fillStyle = css(grass[tone]);
        blades.forEach((bl, i) => {
          if (bl.layer !== layer) return;
          const tip = Math.ceil(bl.h * 0.6);
          for (let k = tone ? tip : 0; k < (tone ? bl.h : tip); k++) {
            const f = k / Math.max(1, bl.h - 1);
            dot(ctx, bl.x + Math.round(bend[i] * f ** 1.6), bl.base - k);
          }
        });
      }
    }
    busy ||= !reduced; // the wind keeps blowing

    return busy;
  }

  /** click: rustle that tree and send the birds hidden in it (and only it) flying */
  function scare(i: number) {
    const tr = trees[i];
    if (!tr) return;
    tr.shake = 1;
    for (const b of birds) {
      if (b.tree !== i || b.state !== "hidden" || b.scareAt) continue;
      if (reduced) {
        b.state = "gone"; // no flight animation: they just leave
        b.returnAt = lastT + RETURN_AFTER;
      } else {
        b.scareAt = lastT + Math.random() * 0.15;
      }
    }
  }

  return {
    layout,
    drawTerrain,
    draw,
    treeAt,
    scare,
    setReducedMotion(v: boolean) {
      reduced = v;
    },
  };
}
