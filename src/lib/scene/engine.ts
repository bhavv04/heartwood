// lib/scene/engine.ts
import { P, type Pointer } from "@/components/skyCanvas";
import { sample, rgbCss } from "@/lib/scene/palette";

export type Theme = "light" | "dark";

const SWAP_SECONDS = 2; // time for one sun <-> moon swap

// smoothstep between a and b
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type Frame = {
  cols: number;
  e: number; // 0 = day .. 1 = night
  toDay: boolean; // true while the night -> day half of the orbit is running
  t: number;
  dt: number;
  ptr: Pointer;
};

export type Layer = {
  rows: number; // height in cells, so the canvas sizes itself
  draw(ctx: CanvasRenderingContext2D, f: Frame): void;
  hit?(p: { x: number; y: number }): boolean; // true = show pointer cursor
  click?(p: { x: number; y: number }): "toggle-theme" | void;
};

type Surface = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  layer: Layer;
  cols: number;
};

export function createEngine(initial: Theme, onTheme: (t: Theme) => void) {
  const surfaces = new Set<Surface>();
  const mouse = { x: 0, y: 0, on: false };

  // `turns` = half-turns requested so far (odd = night). `c` moves toward it at
  // constant speed and only ever increases, so the sun / moon always orbit
  // clockwise, even if you click again mid-swap.
  let turns = initial === "dark" ? 1 : 0;
  let c = turns;
  let shown: Theme = initial; // theme currently applied to the page
  let lastE = -1;
  let t = 0;
  let last = 0;
  let raf = 0;

  const toggle = () => {
    turns += 1; // the page theme follows the animation (see tick)
  };

  const cells = (s: Surface): Pointer => {
    if (!mouse.on) return null;
    const r = s.canvas.getBoundingClientRect();
    const x = (mouse.x - r.left) / P;
    const y = (mouse.y - r.top) / P;
    return x < 0 || y < 0 || x > s.cols || y > s.layer.rows ? null : { x, y };
  };

  const fit = (s: Surface) => {
    const w = s.canvas.clientWidth;
    const h = s.layer.rows * P;
    const dpr = window.devicePixelRatio || 1;
    s.canvas.width = Math.round(w * dpr);
    s.canvas.height = Math.round(h * dpr);
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.cols = Math.ceil(w / P);
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    t += dt;

    c = Math.min(turns, c + dt / SWAP_SECONDS); // constant speed, never overshoots
    const n = Math.floor(c);
    const f = c - n;
    const eased = n + f * f * (3 - 2 * f); // smoothstep: slow start, slow end

    const u = eased % 2; // 0..1 day -> night, 1..2 night -> day
    const toDay = u > 1;
    const e = toDay ? 2 - u : u;

    // publish progress to CSS so the page colours move with the sky
    if (Math.abs(e - lastE) > 0.0005) {
      lastE = e;
      const root = document.documentElement.style;
      const s = sample(e);
      root.setProperty("--sky-bg", rgbCss(s.bg));
      root.setProperty("--sky-line", rgbCss(s.line));
      root.setProperty("--sky-t", ss(0.58, 0.68, e).toFixed(3)); // text flips where bg is mid-tone (contrast is equal both ways)
    }

    // flip data-theme (for `dark:` utilities etc.) at the dusk moment
    const th: Theme = e >= 0.5 ? "dark" : "light";
    if (th !== shown) {
      shown = th;
      onTheme(th);
    }

    let over = false;
    for (const s of surfaces) {
      const ptr = cells(s);
      s.layer.draw(s.ctx, { cols: s.cols, e, toDay, t, dt, ptr });
      if (ptr && s.layer.hit?.(ptr)) over = true; // after draw, so positions are current
    }
    document.documentElement.style.cursor = over ? "pointer" : "";

    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMove = (ev: PointerEvent) => {
    mouse.x = ev.clientX;
    mouse.y = ev.clientY;
    mouse.on = true;
  };
  const onLeave = () => {
    mouse.on = false;
  };
  const onClick = (ev: MouseEvent) => {
    if (
      (ev.target as HTMLElement).closest(
        "a,button,input,textarea,[data-no-sky]",
      )
    )
      return;
    for (const s of surfaces) {
      const p = cells(s);
      if (p && s.layer.click?.(p) === "toggle-theme") toggle();
    }
  };
  const onVis = () => {
    if (document.hidden) stop();
    else if (surfaces.size) start();
  };

  return {
    toggle,
    attach(canvas: HTMLCanvasElement, layer: Layer) {
      const s: Surface = {
        canvas,
        ctx: canvas.getContext("2d")!,
        layer,
        cols: 0,
      };
      fit(s);
      const ro = new ResizeObserver(() => fit(s));
      ro.observe(canvas);

      if (!surfaces.size) {
        window.addEventListener("pointermove", onMove);
        document.addEventListener("pointerleave", onLeave);
        window.addEventListener("click", onClick);
        document.addEventListener("visibilitychange", onVis);
        start();
      }
      surfaces.add(s);

      return () => {
        ro.disconnect();
        surfaces.delete(s);
        if (!surfaces.size) {
          stop();
          document.documentElement.style.cursor = "";
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("click", onClick);
          document.removeEventListener("visibilitychange", onVis);
        }
      };
    },
  };
}
