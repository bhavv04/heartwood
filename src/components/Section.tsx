import { useId } from "react";

export default function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="mb-5 flex items-center gap-3">
        <Vine flip />
        <h2 className="shrink-0 text-base italic leading-none tracking-wide text-muted">
          {title}
        </h2>
        <Vine />
      </div>
      {children}
    </section>
  );
}

const TILE_W = 160;
const TILE_H = 32;
// room at the title end for the curled tip
const CAP_W = 10;
// no fade at the title end, so the curl stays visible; long taper at the far end
const FADE =
  "linear-gradient(to right, #000, #000 calc(100% - 72px), transparent)";

// palette (same greens as SideLeaves)
const STEM = "#6f9a63";
const LEAF = "#5f8f5a";
const BLOOM = "#d46a9a";
const BERRY = "#8e5fc4";
const CENTER = "#d4a72c";

function Vine({ flip = false }: { flip?: boolean }) {
  // Section renders more than once per page, so every pattern needs its own id
  const id = "vine" + useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg
      height={TILE_H}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="block min-w-0 flex-1"
      style={{
        maskImage: FADE,
        WebkitMaskImage: FADE,
        // mirrors pattern, cap and mask together, so the curl always faces the title
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      <defs>
        <pattern
          id={id}
          width={TILE_W}
          height={TILE_H}
          patternUnits="userSpaceOnUse"
        >
          {/* drawing space is 24px tall; shift it to the vertical center of the 32px tile */}
          <g transform="translate(0 4)">
            <g style={{ stroke: STEM, color: STEM }}>
              {/* secondary stem, opposite phase: crosses the main stem at x = 0/40/80/120/160 */}
              <path
                strokeOpacity={0.4}
                d="M0 12 C12 20 28 20 40 12 S68 4 80 12 C92 20 108 20 120 12 S148 4 160 12"
              />
              {/* main stem: two S-waves per tile, tangents match at the seam */}
              <path d="M0 12 C12 4 28 4 40 12 S68 20 80 12 C92 4 108 4 120 12 S148 20 160 12" />
            </g>

            {/* secondary leaves (period 80) */}
            {[0, 80].map((dx) => (
              <g key={dx} strokeOpacity={0.6}>
                <Leaf transform={`translate(${dx + 20} 18) scale(0.8 -0.8)`} />
                <Leaf transform={`translate(${dx + 60} 6) scale(-0.8 0.8)`} />
              </g>
            ))}

            {/* segment A (0-80): leaf pairs, tendril, bloom, berries */}
            <Leaf transform="translate(20 6)" />
            <Leaf transform="translate(20 6) scale(-0.7 0.7)" />
            <Leaf transform="translate(60 18) rotate(180)" />
            <Leaf transform="translate(60 18) scale(0.7 -0.7)" />
            <g style={{ stroke: STEM }}>
              <Tendril />
            </g>
            <Bloom x={40} y={12} />
            <Berries />

            {/* segment B (80-160): mirrored leaf pairs, tendril, buds */}
            <Leaf transform="translate(100 6) scale(-1 1)" />
            <Leaf transform="translate(100 6) scale(0.7)" />
            <Leaf transform="translate(140 18) scale(1 -1)" />
            <Leaf transform="translate(140 18) scale(-0.7 -0.7)" />
            <g style={{ stroke: STEM }}>
              <Tendril transform="rotate(180 80 12)" />
            </g>
            <Bud transform="translate(120 12)" />
            <Bud transform="translate(120 12) rotate(180) scale(0.7)" />
          </g>
        </pattern>
      </defs>

      {/* curled tip: leaves the stem's start going back down-left, then spirals shut */}
      <g transform="translate(0 4)" style={{ stroke: STEM }}>
        <path d="M10 12 C7 14 3.5 14 2.5 11 C1.8 9 3.5 7.8 4.8 8.8 C5.8 9.6 5.2 11 4.2 10.8" />
      </g>

      {/* pattern starts after the cap; stroke="none" stops the rect outlining itself */}
      <g transform={`translate(${CAP_W} 0)`}>
        <rect width="100%" height={TILE_H} fill={`url(#${id})`} stroke="none" />
      </g>
    </svg>
  );
}

function Leaf({ transform }: { transform: string }) {
  return (
    <g transform={transform} style={{ color: LEAF, stroke: LEAF }}>
      {/* faint tint so leaves read as solid shapes, not outlines */}
      <path
        d="M0 0 C1 -4 5 -5 8 -4.5 C7 -1 4 1 0 0Z"
        fill="currentColor"
        fillOpacity={0.3}
      />
      {/* midrib */}
      <path d="M0 0 Q4 -1.2 6.5 -3" strokeOpacity={0.55} />
    </g>
  );
}

function Tendril({ transform }: { transform?: string }) {
  return (
    <path
      transform={transform}
      d="M70.4 16.5 C73 20.5 78 21 77 18 C76.3 16.2 74 17 74.8 18.8"
    />
  );
}

function Bud({ transform }: { transform: string }) {
  const d = "M0 0 C-3 -4 -2 -8 0 -10 C2 -8 3 -4 0 0Z";
  return (
    <g transform={transform} style={{ color: BLOOM, stroke: BLOOM }}>
      {/* page-colored base so the stem doesn't show through */}
      <path d={d} className="fill-bg" />
      <path d={d} fill="currentColor" fillOpacity={0.25} stroke="none" />
    </g>
  );
}

function Berries() {
  return (
    <g style={{ stroke: STEM }}>
      <path d="M80 12 C81 8 84 6 86 4.5" />
      <path d="M83 7 C82 5 83 3.5 84.5 3" strokeOpacity={0.7} />
      <circle cx={86.8} cy={3.8} r={1.3} fill={BERRY} stroke="none" />
      <circle cx={84.8} cy={2.4} r={1} fill={BERRY} stroke="none" />
    </g>
  );
}

function Bloom({ x, y }: { x: number; y: number }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ color: BLOOM, stroke: BLOOM }}
    >
      {/* outer ring */}
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          {/* page-colored base so the stem doesn't show through the petals */}
          <ellipse cx={0} cy={-3.6} rx={2} ry={3.3} className="fill-bg" />
          <ellipse
            cx={0}
            cy={-3.6}
            rx={2}
            ry={3.3}
            fill="currentColor"
            fillOpacity={0.18}
          />
        </g>
      ))}
      {/* inner ring, offset half a step */}
      {[36, 108, 180, 252, 324].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cx={0} cy={-2} rx={1.2} ry={2} className="fill-bg" />
          <ellipse
            cx={0}
            cy={-2}
            rx={1.2}
            ry={2}
            fill="currentColor"
            fillOpacity={0.3}
            strokeOpacity={0.7}
          />
        </g>
      ))}
      <circle r={1.4} fill={CENTER} stroke="none" />
    </g>
  );
}
