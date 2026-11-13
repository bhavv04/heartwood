// lib/scene/sky-layer.ts
import { createSky, ROWS } from "@/components/skyCanvas";
import type { Layer } from "./engine";

export function skyLayer(): Layer {
  const sky = createSky(); // per-instance state, so never call this at module scope
  let disc = { cx: 0, cy: 0, r: 0 };
  const onBody = (p: { x: number; y: number }) =>
    Math.hypot(p.x - disc.cx, p.y - disc.cy) <= disc.r + 2;

  return {
    rows: ROWS,
    draw(ctx, f) {
      disc = sky.draw(ctx, f.cols, f.e, f.t, f.dt, f.ptr, f.toDay);
    },
    // pointer cursor over the sun / moon and over clouds (clicking one starts rain)
    hit: (p) => sky.cloudAt(p.x, p.y) >= 0 || onBody(p),
    click(p) {
      const i = sky.cloudAt(p.x, p.y);
      if (i >= 0) return void sky.toggleRain(i);
      if (onBody(p)) return "toggle-theme";
    },
  };
}
