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
      <div className="mb-5 flex items-center gap-4">
        <Vine flip />
        <h2 className="shrink-0 text-sm tracking-wide text-muted">{title}</h2>
        <Vine />
      </div>
      {children}
    </section>
  );
}

const TILE_W = 160;
const TILE_H = 32;
// fixed-length fades: short sprout at the title, longer taper at the far end
const FADE =
  "linear-gradient(to right, transparent, #000 20px, #000 calc(100% - 72px), transparent)";

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
      className="block min-w-0 flex-1 text-muted"
      style={{
        maskImage: FADE,
        WebkitMaskImage: FADE,
        // mirrors pattern and mask together, so the left vine sprouts at the title and tapers outward
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
            {/* secondary stem, opposite phase: crosses the main stem at x = 0/40/80/120/160 for a braided look */}
            <path
              strokeOpacity={0.4}
              d="M0 12 C12 20 28 20 40 12 S68 4 80 12 C92 20 108 20 120 12 S148 4 160 12"
            />
            {/* main stem: two S-waves per tile, tangents match at the seam */}
            <path d="M0 12 C12 4 28 4 40 12 S68 20 80 12 C92 4 108 4 120 12 S148 20 160 12" />

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
            <Tendril />
            <Bloom x={40} y={12} />
            <Berries />

            {/* segment B (80-160): mirrored leaf pairs, tendril, buds */}
            <Leaf transform="translate(100 6) scale(-1 1)" />
            <Leaf transform="translate(100 6) scale(0.7)" />
            <Leaf transform="translate(140 18) scale(1 -1)" />
            <Leaf transform="translate(140 18) scale(-0.7 -0.7)" />
            <Tendril transform="rotate(180 80 12)" />
            <Bud transform="translate(120 12)" />
            <Bud transform="translate(120 12) rotate(180) scale(0.7)" />
          </g>
        </pattern>
      </defs>

      {/* stroke="none" stops the rect outlining itself with the inherited stroke */}
      <rect width="100%" height={TILE_H} fill={`url(#${id})`} stroke="none" />
    </svg>
  );
}

function Leaf({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      {/* faint tint so leaves read as solid shapes, not outlines */}
      <path
        d="M0 0 C1 -4 5 -5 8 -4.5 C7 -1 4 1 0 0Z"
        fill="currentColor"
        fillOpacity={0.14}
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
  return (
    <path
      transform={transform}
      className="fill-bg"
      d="M0 0 C-3 -4 -2 -8 0 -10 C2 -8 3 -4 0 0Z"
    />
  );
}

function Berries() {
  return (
    <g>
      <path d="M80 12 C81 8 84 6 86 4.5" />
      <path d="M83 7 C82 5 83 3.5 84.5 3" strokeOpacity={0.7} />
      <circle cx={86.8} cy={3.8} r={1.3} fill="currentColor" stroke="none" />
      <circle cx={84.8} cy={2.4} r={1} fill="currentColor" stroke="none" />
    </g>
  );
}

function Bloom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* filled with the page bg so the stem doesn't show through the petals */}
      <g className="fill-bg">
        {/* outer ring */}
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx={0}
            cy={-3.6}
            rx={2}
            ry={3.3}
            transform={`rotate(${a})`}
          />
        ))}
        {/* inner ring, offset half a step */}
        {[36, 108, 180, 252, 324].map((a) => (
          <ellipse
            key={a}
            cx={0}
            cy={-2}
            rx={1.2}
            ry={2}
            strokeOpacity={0.7}
            transform={`rotate(${a})`}
          />
        ))}
      </g>
      <circle r={1.4} fill="currentColor" stroke="none" />
    </g>
  );
}
