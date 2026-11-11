"use client";

import { useEffect, useRef } from "react";
import { P, ROWS, createSky, type Pointer } from "./skyCanvas";

const SWAP_MS = 1000; // sun <-> moon swap duration
const FRAME_MS = 45; // ~22 fps is plenty for dithered clouds

// gradients behind the canvas, cross-faded with the swap.
// each one must end in the page background colour (alpha 0) so there is no seam:
//   light --bg #f7efe4 -> rgba(247,239,228,0)    dark --bg #0a0a0a -> rgba(10,10,10,0)
const DAY_BG =
  "linear-gradient(to bottom, #e9c4a3 0%, #f2d9c0 50%, rgba(247,239,228,0) 100%)";
const NIGHT_BG =
  "linear-gradient(to bottom, #030303 0%, #080808 55%, rgba(10,10,10,0) 100%)";

export default function SkyTheme() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const cols = useRef(300);
  const hit = useRef<{ cx: number; cy: number; r: number } | null>(null);
  const ptr = useRef<Pointer>(null);
  const sky = useRef<ReturnType<typeof createSky> | null>(null);
  const st = useRef({ phase: 0, target: 0, applied: "light", t: 0 });

  useEffect(() => {
    const root = document.documentElement;
    const s = st.current;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    sky.current = createSky();
    const stored = root.dataset.theme;
    const dark = stored
      ? stored === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    s.phase = s.target = dark ? 1 : 0;
    s.applied = dark ? "dark" : "light";
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const w = wrapRef.current!.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      cols.current = Math.ceil(w / P);
      canvas.width = Math.round(cols.current * P * dpr);
      canvas.height = Math.round(ROWS * P * dpr);
      canvas.style.width = `${cols.current * P}px`;
      canvas.style.height = `${ROWS * P}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      frame(performance.now(), true);
    });
    ro.observe(wrapRef.current!);

    let last = performance.now();
    let raf = 0;

    function frame(now: number, force = false) {
      const dtMs = Math.min(now - last, 100);
      if (!force && now - last < FRAME_MS) {
        raf = requestAnimationFrame(frame);
        return;
      }
      last = now;
      const dt = dtMs / 1000;
      if (!reduce) s.t += dt;

      const step = dtMs / SWAP_MS;
      if (s.phase < s.target) s.phase = Math.min(s.target, s.phase + step);
      else if (s.phase > s.target) s.phase = Math.max(s.target, s.phase - step);

      // flip the real page theme early in the swap (same in both directions)
      const want =
        s.target === 1 && s.phase >= 0.25
          ? "dark"
          : s.target === 0 && s.phase <= 0.75
            ? "light"
            : s.applied;
      if (want !== s.applied) {
        s.applied = want;
        root.dataset.theme = want;
        try {
          localStorage.setItem("theme", want);
        } catch {}
      }

      const e = s.phase * s.phase * (3 - 2 * s.phase); // smoothstep
      const disc = sky.current!.draw(
        ctx,
        cols.current,
        e,
        s.t,
        dt,
        ptr.current,
      );
      if (dayRef.current) dayRef.current.style.opacity = String(1 - e);
      if (nightRef.current) nightRef.current.style.opacity = String(e);
      hit.current = s.phase === s.target ? disc : null;
      if (!force) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const s = st.current;
    if (s.phase !== s.target) return; // ignore clicks mid-swap
    s.target = 1 - s.target;
  };

  // pointer position in grid cells
  const cellOf = (e: React.PointerEvent | React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / P, y: (e.clientY - r.top) / P };
  };
  const overBody = (p: { x: number; y: number }) => {
    const h = hit.current;
    return !!h && Math.hypot(p.x - h.cx, p.y - h.cy) <= h.r + 3;
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden"
      style={{ height: ROWS * P }}
    >
      <div
        ref={dayRef}
        aria-hidden
        className="absolute inset-0"
        style={{ background: DAY_BG }}
      />
      <div
        ref={nightRef}
        aria-hidden
        className="absolute inset-0"
        style={{ background: NIGHT_BG, opacity: 0 }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute left-0 top-0 select-none"
        onPointerMove={(e) => {
          const p = cellOf(e);
          ptr.current = p; // clouds part around the cursor and glow when hovered
          const over =
            overBody(p) || (sky.current?.cloudAt(p.x, p.y) ?? -1) >= 0;
          canvasRef.current!.style.cursor = over ? "pointer" : "default";
        }}
        onPointerLeave={() => {
          ptr.current = null;
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") ptr.current = null;
        }}
        onClick={(e) => {
          const p = cellOf(e);
          if (overBody(p)) return toggleTheme(); // sun / moon -> switch theme
          const i = sky.current?.cloudAt(p.x, p.y) ?? -1;
          if (i >= 0) sky.current!.toggleRain(i); // cloud -> bounce + rain
        }}
      />
      <button type="button" className="sr-only" onClick={toggleTheme}>
        Toggle light / dark theme
      </button>
    </div>
  );
}
