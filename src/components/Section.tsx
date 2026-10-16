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
      <div className="mb-4 flex items-center gap-3">
        <h2 className="shrink-0 text-sm tracking-wide text-muted">{title}</h2>
        <Vine />
      </div>
      {children}
    </section>
  );
}

const TILE_W = 160;
const TILE_H = 24;
// both ends fade out so the vine grows from the title and never ends abruptly
const FADE =
  "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)";

function Vine() {
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
      className="min-w-0 flex-1 text-muted"
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <defs>
        <pattern id={id} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
          {/* continuous stem: two S-waves per tile, tangents match at the seam */}
          <path d="M0 12 C12 4 28 4 40 12 S68 20 80 12 C92 4 108 4 120 12 S148 20 160 12" />

          {/* segment A (0-80): alternating leaves, tendril, bloom */}
          <Leaf transform="translate(20 6)" />
          <Leaf transform="translate(60 18) rotate(180)" />
          <path d="M70.4 16.5 C73 20.5 78 21 77 18 C76.3 16.2 74 17 74.8 18.8" />
          <Bloom x={40} y={12} />

          {/* segment B (80-160): mirrored leaves, bud */}
          <Leaf transform="translate(100 6) scale(-1 1)" />
          <Leaf transform="translate(140 18) scale(1 -1)" />
          <path
            transform="translate(120 12)"
            d="M0 0 C-3 -4 -2 -8 0 -10 C2 -8 3 -4 0 0Z"
          />
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
      <path d="M0 0 C1 -4 5 -5 8 -4.5 C7 -1 4 1 0 0Z" />
      {/* midrib */}
      <path d="M0 0 Q4 -1.2 6.5 -3" strokeOpacity={0.55} />
    </g>
  );
}

function Bloom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* filled with the page bg so the stem doesn't show through the petals */}
      <g className="fill-bg">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-3} rx={1.7} ry={2.7} transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r={1.3} fill="currentColor" stroke="none" />
    </g>
  );
}