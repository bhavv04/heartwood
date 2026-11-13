// components/SceneCanvas.tsx
"use client";
import { useEffect, useRef } from "react";
import { P } from "@/components/skyCanvas";
import type { Layer } from "@/lib/scene/engine";
import { useScene } from "@/context/SceneContext";

export default function SceneCanvas({
  layer,
  className,
}: {
  layer: Layer;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { engine } = useScene();
  useEffect(() => engine.attach(ref.current!, layer), [engine, layer]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ height: layer.rows * P }}
    />
  );
}
