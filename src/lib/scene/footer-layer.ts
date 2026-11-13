// lib/scene/footer-layer.ts
import type { Layer } from "@/lib/scene/engine";

export function footerLayer(): Layer {
  return {
    rows: 40,
    draw(ctx, f) {
      /* ... */
    },
  };
}
