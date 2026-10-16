import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import { SiGo, SiC, SiRust, SiTypescript, SiPython, SiNvidia } from "react-icons/si";

const ICONS: Record<Lang, IconType> = {
  Go: SiGo,
  C: SiC,
  Rust: SiRust,
  TypeScript: SiTypescript,
  Python: SiPython,
  CUDA: SiNvidia, 
};

const COLORS: Record<Lang, string> = {
  Go: "#00ADD8",
  C: "#A8B9CC",
  Rust: "#DEA584",
  TypeScript: "#3178C6",
  Python: "#3776AB",
  CUDA: "#76B900", // Nvidia green
};

const W = 640;
const H = 340;

type Anchor = "start" | "middle" | "end";
type Lang = "Go" | "C" | "Rust" | "TypeScript" | "Python" | "CUDA";

const HUB_R = 12;
const LABEL_GAP = 8; 

type Side = "top" | "bottom" | "left" | "right";

const LANGS: Record<Lang, { x: number; y: number; side: Side }> = {
  Go: { x: 60, y: 150, side: "top" },
  C: { x: 60, y: 265, side: "top" },
  Rust: { x: 225, y: 190, side: "top" },
  TypeScript: { x: 395, y: 110, side: "right" },
  Python: { x: 520, y: 215, side: "left" },
  CUDA: { x: 400, y: 305, side: "left" },
};

function hubLabel(x: number, y: number, side: Side) {
  const d = HUB_R + LABEL_GAP;
  switch (side) {
    case "top":
      return { x, y: y - d, anchor: "middle" as Anchor, dy: "0" };
    case "bottom":
      return { x, y: y + d, anchor: "middle" as Anchor, dy: "0.8em" };
    case "left":
      return { x: x - d, y, anchor: "end" as Anchor, dy: "0.35em" };
    case "right":
      return { x: x + d, y, anchor: "start" as Anchor, dy: "0.35em" };
  }
}
type Project = {
  name: string;
  x: number;
  y: number;
  langs: Lang[];
  research?: boolean;
  lx: number;
  ly: number;
  a: Anchor;
};

// order = order they appear in the animation
const PROJECTS: Project[] = [
  { name: "creduce", x: 140, y: 305, langs: ["C"], lx: 140, ly: 325, a: "middle" },
  { name: "awk-rs", x: 140, y: 185, langs: ["Rust"], lx: 140, ly: 171, a: "middle" },
  { name: "Groat", x: 205, y: 280, langs: ["Rust"], lx: 217, ly: 284, a: "start" },
  { name: "Thunderhead", x: 245, y: 70, langs: ["Go", "TypeScript"], lx: 245, ly: 56, a: "middle" },
  { name: "Funes", x: 305, y: 150, langs: ["Rust", "TypeScript"], lx: 305, ly: 136, a: "middle" },
  { name: "Collatz Explorer", x: 320, y: 215, langs: ["Rust", "TypeScript"], lx: 320, ly: 237, a: "middle" },
  { name: "GAIA", x: 470, y: 160, langs: ["Python", "TypeScript"], research: true, lx: 462, ly: 176, a: "end" },
  { name: "Lacunae", x: 565, y: 150, langs: ["Python"], research: true, lx: 577, ly: 154, a: "start" },
  { name: "Precursor", x: 600, y: 90, langs: [], research: true, lx: 600, ly: 76, a: "middle" },
  { name: "Wattson", x: 470, y: 265, langs: ["Python", "CUDA"], lx: 482, ly: 270, a: "start" },
  { name: "Solace", x: 610, y: 250, langs: ["Python"], lx: 610, ly: 270, a: "middle" },
  { name: "Quantum drug binding", x: 545, y: 290, langs: ["Python"], lx: 545, ly: 310, a: "middle" },
];

// research projects joined like a constellation, in this order
const RESEARCH_CHAIN = ["GAIA", "Lacunae", "Precursor"];
// --------------------------------------------------------------------------

const START = 1.0; // when the first project begins
const STEP = 0.22; // seconds between projects

const s = (d: number, t?: number): CSSProperties =>
  ({ "--d": `${d.toFixed(2)}s`, ...(t ? { "--t": `${t}s` } : {}) }) as CSSProperties;

// deterministic PRNG so server and client render the same stars
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(7);
const STARS = Array.from({ length: 38 }, () => ({
  x: Math.round(rnd() * W * 10) / 10,
  y: Math.round(rnd() * H * 10) / 10,
  r: 0.6 + rnd() * 0.8,
  d: rnd() * 1.2,
}));

const byName = Object.fromEntries(PROJECTS.map((p) => [p.name, p]));
const chain = RESEARCH_CHAIN.map((n) => byName[n]);
const chainPath = chain.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
const LAST = START + (PROJECTS.length - 1) * STEP;
const CHAIN_AT = LAST + 0.8;

export default function ConstellationDiagram() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="A star chart of projects. Each project is a point linked to the languages and tools it uses: Rust, Go, C, Python, TypeScript and CUDA. Research projects are ringed and joined by a dashed line."
      className="h-auto w-full"
    >

      {/* language edges */}
      <g fill="none" className="stroke-muted" strokeWidth={1} strokeOpacity={0.6}>
        {PROJECTS.flatMap((p, i) =>
          p.langs.map((l) => (
            <path
              key={`${p.name}-${l}`}
              d={`M${LANGS[l].x} ${LANGS[l].y} L${p.x} ${p.y}`}
              pathLength={1}
              className="hw-draw"
              style={s(START + i * STEP, 0.5)}
            />
          )),
        )}
      </g>

      {/* research constellation line */}
      <path
        d={chainPath}
        fill="none"
        className="hw-fade stroke-fg"
        strokeWidth={1}
        strokeOpacity={0.55}
        strokeDasharray="2 4"
        style={s(CHAIN_AT)}
      />

    {/* language hubs */}
    {(Object.keys(LANGS) as Lang[]).map((l, i) => {
    const { x, y, side } = LANGS[l];
    const Icon = ICONS[l];
    const lab = hubLabel(x, y, side);
    return (
        <g key={l}>
        <g className="hw-pop" style={s(0.4 + i * 0.1)}>
            <circle cx={x} cy={y} r={HUB_R} className="fill-bg stroke-fg" strokeWidth={1} />
            <Icon x={x - 7} y={y - 7} size={14} color={COLORS[l]} />
        </g>
        <text
            x={lab.x}
            y={lab.y}
            dy={lab.dy}
            textAnchor={lab.anchor}
            fontSize={12}
            className="fill-muted stroke-bg hw-fade"
            strokeWidth={3}
            paintOrder="stroke"
            strokeLinejoin="round"
            style={s(0.6 + i * 0.1)}
        >
            {l}
        </text>
        </g>
    );
    })}

      {/* projects */}
      {PROJECTS.map((p, i) => {
        const t0 = START + i * STEP;
        return (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r={4.5} className="hw-pop fill-fg" style={s(t0 + 0.4)} />
            {p.research && (
              <circle
                cx={p.x}
                cy={p.y}
                r={9}
                fill="none"
                className="hw-pop stroke-fg"
                strokeWidth={1}
                strokeOpacity={0.55}
                style={s(CHAIN_AT + 0.4)}
              />
            )}
            <text
              x={p.lx}
              y={p.ly}
              textAnchor={p.a}
              fontSize={12}
              className="fill-fg hw-fade"
              style={s(t0 + 0.5)}
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}