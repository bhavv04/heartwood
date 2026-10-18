import { useId, type ReactNode } from "react";

const TILE_W = 340;
const TILE_H = 900;
// solid at the screen edge, gone before the content column
const FADE = "linear-gradient(to right, #000 0%, #000 55%, transparent 100%)";

const f = (n: number) => n.toFixed(1);

// ---------- palette ----------
// greens read CSS variables first, so a dark theme can override them
// (e.g. `.dark { --garden-stem: #8fbf84; --garden-leaf-1: #7fb376; }`)

const cssVar = (name: string, fallback: string) =>
  `var(--garden-${name}, ${fallback})`;

const STEM = cssVar("stem", "#6f9a63");
const GREENS = [
  cssVar("leaf-1", "#5f8f5a"),
  cssVar("leaf-2", "#6c9b5c"),
  cssVar("leaf-3", "#527f55"),
];

// petals and outlines
const BLOOM: Record<Kind, string> = {
  daisy: "#9aa5b8", // white petals on the page color, so only the outline shows
  cosmos: "#d46a9a",
  sunflower: "#e0a020",
  poppy: "#d9453b",
  rose: "#c2456b",
  allium: "#8e5fc4",
  tulip: "#e07a3f",
  lavender: "#8a74c9",
  foxglove: "#b05fa8",
};

// centers, seeds and stamens, where a flower has a contrasting middle
const ACCENT: Partial<Record<Kind, string>> = {
  daisy: "#e8b923",
  cosmos: "#e0a020",
  sunflower: "#6b4423",
  poppy: "#2f2a2a",
};

// ---------- shape builders (absolute coordinates, so strokes never scale) ----------

const ell = (rx: number, ry: number) =>
  `M${f(-rx)} 0 A${f(rx)} ${f(ry)} 0 1 0 ${f(rx)} 0 A${f(rx)} ${f(ry)} 0 1 0 ${f(-rx)} 0Z`;

// leaf pointing along +x, base at the origin
const leaf = (L: number) =>
  `M0 0 C${f(0.2 * L)} ${f(-0.28 * L)} ${f(0.75 * L)} ${f(-0.3 * L)} ${f(L)} 0 C${f(0.75 * L)} ${f(0.3 * L)} ${f(0.2 * L)} ${f(0.28 * L)} 0 0Z`;

// foxglove bell hanging along +y
const bell = (s: number) =>
  `M0 0 C${f(-5 * s)} ${f(3 * s)} ${f(-6.5 * s)} ${f(9 * s)} ${f(-5 * s)} ${f(13 * s)} C${f(-2 * s)} ${f(15 * s)} ${f(2 * s)} ${f(15 * s)} ${f(5 * s)} ${f(13 * s)} C${f(6.5 * s)} ${f(9 * s)} ${f(5 * s)} ${f(3 * s)} 0 0Z`;

// tulip petal pointing along +x
const TULIP_PETAL = "M0 0 C6 -13 26 -13 38 0 C26 13 6 13 0 0Z";

// ---------- building blocks ----------

// page-colored base + tint, so overlapping shapes hide what's behind them
function Solid({
  d,
  transform,
  tint = 0.2,
}: {
  d: string;
  transform?: string;
  tint?: number;
}) {
  return (
    <g transform={transform}>
      <path d={d} className="fill-bg" />
      <path d={d} fill="currentColor" fillOpacity={tint} stroke="none" />
    </g>
  );
}

function Disc({ r, tint = 0.4 }: { r: number; tint?: number }) {
  return (
    <g>
      <circle r={f(r)} className="fill-bg" />
      <circle r={f(r)} fill="currentColor" fillOpacity={tint} stroke="none" />
    </g>
  );
}

// n petals around the origin; each petal's center sits `cy` away from it
function Ring({
  n,
  rx,
  ry,
  cy,
  offset = 0,
  tint = 0.2,
}: {
  n: number;
  rx: number;
  ry: number;
  cy: number;
  offset?: number;
  tint?: number;
}) {
  const d = ell(rx, ry);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Solid
          key={i}
          d={d}
          tint={tint}
          transform={`rotate(${f(offset + (i * 360) / n)}) translate(0 ${f(cy)})`}
        />
      ))}
    </g>
  );
}

// `tone` picks one of the greens, so a plant isn't a single flat color
function Leaf({
  x,
  y,
  a,
  L,
  tone = 0,
}: {
  x: number;
  y: number;
  a: number;
  L: number;
  tone?: number;
}) {
  const c = GREENS[tone % GREENS.length];
  return (
    <g
      transform={`translate(${f(x)} ${f(y)}) rotate(${f(a)})`}
      style={{ color: c, stroke: c }}
    >
      <Solid d={leaf(L)} tint={0.32} />
      {/* midrib */}
      <path d={`M0 0 L${f(L * 0.93)} 0`} strokeOpacity={0.65} />
      {/* side veins */}
      <path
        d={`M${f(L * 0.3)} 0 L${f(L * 0.5)} ${f(-L * 0.13)} M${f(L * 0.3)} 0 L${f(L * 0.5)} ${f(L * 0.13)} M${f(L * 0.55)} 0 L${f(L * 0.72)} ${f(-L * 0.1)} M${f(L * 0.55)} 0 L${f(L * 0.72)} ${f(L * 0.1)}`}
        strokeOpacity={0.35}
      />
    </g>
  );
}

// ---------- flower heads (origin = stem tip, stem arrives along -x) ----------

type Kind =
  | "daisy"
  | "cosmos"
  | "sunflower"
  | "poppy"
  | "rose"
  | "allium"
  | "tulip"
  | "lavender"
  | "foxglove";

function Head({ kind, r }: { kind: Kind; r: number }) {
  const accent = ACCENT[kind] ?? BLOOM[kind];

  switch (kind) {
    case "daisy":
      return (
        <g>
          <Ring n={14} rx={r * 0.15} ry={r * 0.5} cy={-r * 0.55} tint={0.12} />
          <g style={{ color: accent, stroke: accent }}>
            <Disc r={r * 0.3} tint={0.9} />
          </g>
        </g>
      );

    case "cosmos":
      return (
        <g>
          <Ring n={8} rx={r * 0.3} ry={r * 0.5} cy={-r * 0.55} tint={0.16} />
          <circle r={f(r * 0.16)} fill={accent} stroke="none" />
        </g>
      );

    case "sunflower": {
      const seeds = Array.from({ length: 28 }, (_, i) => {
        const rr = r * 0.5 * Math.sqrt((i + 0.5) / 28);
        const ang = i * 2.39996;
        return [rr * Math.cos(ang), rr * Math.sin(ang)] as const;
      });
      return (
        <g>
          <Ring n={20} rx={r * 0.09} ry={r * 0.3} cy={-r * 0.8} tint={0.3} />
          <Ring
            n={20}
            rx={r * 0.09}
            ry={r * 0.28}
            cy={-r * 0.74}
            offset={9}
            tint={0.3}
          />
          <g style={{ color: accent, stroke: accent }}>
            <Disc r={r * 0.55} tint={0.55} />
            {seeds.map(([x, y], i) => (
              <circle
                key={i}
                cx={f(x)}
                cy={f(y)}
                r={0.9}
                fill="currentColor"
                fillOpacity={0.7}
                stroke="none"
              />
            ))}
          </g>
        </g>
      );
    }

    case "poppy":
      return (
        <g>
          <Ring n={5} rx={r * 0.52} ry={r * 0.5} cy={-r * 0.5} tint={0.22} />
          {Array.from({ length: 5 }, (_, i) => (
            <path
              key={i}
              d={`M0 ${f(-r * 0.15)} L0 ${f(-r * 0.7)}`}
              strokeOpacity={0.3}
              transform={`rotate(${f(i * 72)})`}
            />
          ))}
          <g style={{ stroke: accent, color: accent }}>
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i} transform={`rotate(${f(i * 30)})`}>
                <path
                  d={`M0 ${f(-r * 0.22)} L0 ${f(-r * 0.42)}`}
                  strokeOpacity={0.6}
                />
                <circle
                  cy={f(-r * 0.44)}
                  r={1.1}
                  fill="currentColor"
                  stroke="none"
                />
              </g>
            ))}
            <circle r={f(r * 0.2)} fill="currentColor" stroke="none" />
          </g>
        </g>
      );

    case "rose":
      return (
        <g>
          <Ring n={5} rx={r * 0.46} ry={r * 0.4} cy={-r * 0.52} tint={0.14} />
          <Ring
            n={5}
            rx={r * 0.34}
            ry={r * 0.3}
            cy={-r * 0.36}
            offset={36}
            tint={0.2}
          />
          <Ring
            n={4}
            rx={r * 0.22}
            ry={r * 0.2}
            cy={-r * 0.2}
            offset={20}
            tint={0.28}
          />
          <path
            d={`M${f(-r * 0.1)} 0 C${f(-r * 0.1)} ${f(-r * 0.12)} ${f(r * 0.12)} ${f(-r * 0.12)} ${f(r * 0.12)} 0 C${f(r * 0.12)} ${f(r * 0.1)} ${f(-r * 0.02)} ${f(r * 0.1)} ${f(-r * 0.02)} ${f(r * 0.02)}`}
            strokeOpacity={0.8}
          />
        </g>
      );

    case "allium":
      return (
        <g>
          <Disc r={r} tint={0.12} />
          {Array.from({ length: 18 }, (_, i) => (
            <g key={i} transform={`rotate(${f(i * 20)})`}>
              <path d={`M0 0 L0 ${f(-r * 0.78)}`} strokeOpacity={0.5} />
              <circle
                cy={f(-r * 0.84)}
                r={1.7}
                fill="currentColor"
                stroke="none"
              />
            </g>
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <circle
              key={i}
              cy={f(-r * 0.45)}
              r={1.3}
              fill="currentColor"
              fillOpacity={0.7}
              stroke="none"
              transform={`rotate(${f(i * 40 + 10)})`}
            />
          ))}
        </g>
      );

    case "tulip":
      return (
        <g transform={`scale(${f(r / 20)})`}>
          <Solid d={TULIP_PETAL} transform="rotate(-28)" tint={0.18} />
          <Solid d={TULIP_PETAL} transform="rotate(28)" tint={0.18} />
          <Solid d={TULIP_PETAL} tint={0.28} />
          <path d="M3 0 L30 0" strokeOpacity={0.4} />
        </g>
      );

    case "lavender": {
      const L = r;
      const florets: ReactNode[] = [];
      for (let x = 5; x <= L; x += 5.5) {
        const s = 1 - 0.6 * (x / L);
        for (const sg of [-1, 1]) {
          florets.push(
            <Solid
              key={`${x}-${sg}`}
              d={ell(4.2 * s, 1.8 * s)}
              tint={0.42}
              transform={`translate(${f(x)} ${f(sg * 2.6 * s)}) rotate(${sg * 35})`}
            />,
          );
        }
      }
      return (
        <g>
          <path d={`M0 0 L${f(L)} 0`} />
          {florets}
        </g>
      );
    }

    case "foxglove": {
      const L = r;
      const bells: ReactNode[] = [];
      for (let i = 0, x = 6; x <= L - 10; i++, x += 9.5) {
        const s = 1 - 0.55 * (x / L);
        const sg = i % 2 === 0 ? -1 : 1;
        bells.push(
          <g key={i} transform={`translate(${f(x)} 0) scale(1 ${sg})`}>
            <Solid d={bell(s)} tint={0.3} />
          </g>,
        );
      }
      return (
        <g>
          <path d={`M0 0 L${f(L)} 0`} />
          {bells}
          <Solid
            d={ell(5, 2.5)}
            tint={0.35}
            transform={`translate(${f(L - 2)} 0)`}
          />
        </g>
      );
    }
  }
}

// ---------- plants ----------

type PlantSpec = {
  kind: Kind;
  y: number; // where the stem leaves the screen edge
  a: number; // growth angle in degrees; negative leans upward
  len: number; // stem length
  r: number; // head size (spike length for lavender and foxglove)
  bend: number; // how far the stem bows
};

// every plant leans up, so its base sits low and nothing crosses the tile seam
const PLANTS: PlantSpec[] = [
  { kind: "daisy", y: 60, a: -18, len: 50, r: 9, bend: 5 },
  { kind: "daisy", y: 110, a: -20, len: 90, r: 16, bend: 8 },
  { kind: "tulip", y: 215, a: -45, len: 120, r: 22, bend: -10 },
  { kind: "sunflower", y: 300, a: -25, len: 140, r: 26, bend: 12 },
  { kind: "cosmos", y: 330, a: -8, len: 60, r: 10, bend: 5 },
  { kind: "lavender", y: 385, a: -55, len: 100, r: 56, bend: 10 },
  { kind: "poppy", y: 455, a: -15, len: 110, r: 20, bend: -10 },
  { kind: "daisy", y: 520, a: -30, len: 55, r: 9, bend: 6 },
  { kind: "allium", y: 535, a: -60, len: 120, r: 20, bend: 12 },
  { kind: "foxglove", y: 605, a: -40, len: 100, r: 66, bend: -10 },
  { kind: "rose", y: 665, a: -10, len: 90, r: 18, bend: 8 },
  { kind: "cosmos", y: 735, a: -30, len: 110, r: 20, bend: 10 },
  { kind: "cosmos", y: 770, a: -12, len: 60, r: 10, bend: 5 },
  { kind: "tulip", y: 805, a: -50, len: 100, r: 20, bend: -8 },
  { kind: "daisy", y: 865, a: -25, len: 80, r: 14, bend: 6 },
];

// x = -6 so stems visibly emerge from past the screen edge
function Plant({ kind, y, a, len, r, bend }: PlantSpec) {
  const leaves = [0.2, 0.42, 0.64].map((t, i) => {
    const x = len * t;
    const yy = 2 * (1 - t) * t * bend;
    const tang = (Math.atan2(2 * bend * (1 - 2 * t), len) * 180) / Math.PI;
    const side = i % 2 === 0 ? -1 : 1;
    const L = (30 - i * 4) * Math.min(1.3, len / 90);
    // deterministic per-plant variation in leaf color
    const tone = i + Math.round(y / 50);
    return <Leaf key={i} x={x} y={yy} a={tang + side * 50} L={L} tone={tone} />;
  });

  return (
    <g transform={`translate(-6 ${y}) rotate(${a})`}>
      <g style={{ color: STEM, stroke: STEM }}>
        <path d={`M0 0 Q${f(len / 2)} ${f(bend)} ${f(len)} 0`} />
      </g>
      {leaves}
      <g
        transform={`translate(${f(len)} 0)`}
        style={{ color: BLOOM[kind], stroke: BLOOM[kind] }}
      >
        <Head kind={kind} r={r} />
      </g>
    </g>
  );
}

// a fan of leaves at the edge, so the base of the garden looks full
function Fan({ y }: { y: number }) {
  const angles = [-80, -55, -30, -5, 20];
  const lengths = [44, 62, 54, 64, 46];
  return (
    <g transform={`translate(-6 ${y})`}>
      {angles.map((a, i) => (
        <Leaf key={a} x={0} y={0} a={a} L={lengths[i]} tone={i + 1} />
      ))}
    </g>
  );
}

// ---------- layer ----------

export default function SideLeaves() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 hidden select-none lg:block"
    >
      <Side />
      <Side flip />
    </div>
  );
}

function Side({ flip = false }: { flip?: boolean }) {
  // two instances per page, so each pattern needs its own id
  const id = "garden" + useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div
      className={`absolute inset-y-0 overflow-hidden opacity-90 ${
        flip ? "right-0" : "left-0"
      }`}
      style={{
        // fills the gutter beside the content (assumes ~44rem of content)
        width: "clamp(0px, calc((100vw - 44rem) / 2 + 24px), 340px)",
        maskImage: FADE,
        WebkitMaskImage: FADE,
        // mirror the whole column, so the right side grows inward too
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      <svg
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block"
      >
        <defs>
          <pattern
            id={id}
            width={TILE_W}
            height={TILE_H}
            patternUnits="userSpaceOnUse"
            // shift the right side so the two gardens aren't mirror images
            patternTransform={flip ? "translate(0 430)" : undefined}
          >
            {/* leaf fans first, so the plants grow out of them */}
            {[150, 330, 500, 680, 840].map((y) => (
              <Fan key={y} y={y} />
            ))}
            {PLANTS.map((p, i) => (
              <Plant key={i} {...p} />
            ))}
          </pattern>
        </defs>

        {/* stroke="none" stops the rect outlining itself with the inherited stroke */}
        <rect width="100%" height="100%" fill={`url(#${id})`} stroke="none" />
      </svg>
    </div>
  );
}
