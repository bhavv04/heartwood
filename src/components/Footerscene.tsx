"use client";

import { useEffect, useRef } from "react";
import { createLandscape, P, ROWS, type Pointer } from "@/components/landscape";

export default function FooterScene() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const terrain = document.createElement("canvas"); // mountains are drawn once, then reused
    const tctx = terrain.getContext("2d")!;
    const land = createLandscape();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    land.setReducedMotion(motion.matches);

    let cols = 0;
    let dpr = 1;
    let ptr: Pointer = null;
    let raf = 0;
    let last = 0;
    let visible = true;

    const paintTerrain = () => {
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.clearRect(0, 0, cols * P, ROWS * P);
      land.drawTerrain(tctx);
    };

    const frame = (now: number) => {
      raf = 0;
      const t = now / 1000;
      const dt = Math.min(0.05, last ? t - last : 0.016);
      last = t;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cols * P, ROWS * P);
      ctx.drawImage(terrain, 0, 0, cols * P, ROWS * P);
      const busy = land.draw(ctx, cols, t, dt, ptr);

      // keep the loop alive only while something is moving
      if (busy && visible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !visible) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const next = Math.max(1, Math.ceil(box.clientWidth / P));
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      if (next === cols && nextDpr === dpr) return;
      cols = next;
      dpr = nextDpr;
      for (const c of [canvas, terrain]) {
        c.width = Math.round(cols * P * dpr);
        c.height = Math.round(ROWS * P * dpr);
      }
      canvas.style.width = `${cols * P}px`;
      canvas.style.height = `${ROWS * P}px`;
      land.layout(cols);
      paintTerrain();
      wake();
    };

    const toCells = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: (ev.clientX - r.left) / P, y: (ev.clientY - r.top) / P };
    };
    const onMove = (ev: PointerEvent) => {
      ptr = toCells(ev);
      canvas.style.cursor =
        land.treeAt(ptr.x, ptr.y) >= 0 ? "pointer" : "default";
      wake();
    };
    const onLeave = () => {
      ptr = null;
      canvas.style.cursor = "default";
      wake();
    };
    const onClick = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const i = land.treeAt(
        (ev.clientX - r.left) / P,
        (ev.clientY - r.top) / P,
      );
      if (i < 0) return;
      land.scare(i);
      wake();
    };

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(box);
    const visibleObs = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    visibleObs.observe(box);
    const onMotion = () => land.setReducedMotion(motion.matches);
    motion.addEventListener("change", onMotion);

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      resizeObs.disconnect();
      visibleObs.disconnect();
      motion.removeEventListener("change", onMotion);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div ref={boxRef} className="w-full select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Pixel-art mountains and pine trees with birds. Click a tree to startle the birds."
        className="block"
        style={{ height: ROWS * P }}
      />
    </div>
  );
}
