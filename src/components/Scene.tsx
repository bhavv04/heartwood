"use client";
import { useState } from "react";
import { SceneProvider } from "@/context/SceneContext";
import SceneCanvas from "./SceneCanvas";
import FooterScene from "./Footerscene"; // temporary: remove once footerLayer is ported
import { skyLayer } from "@/lib/scene/sky-layer";

export default function Scene({ children }: { children: React.ReactNode }) {
  const [sky] = useState(skyLayer);
  return (
    <SceneProvider>
      <main className="mx-auto max-w-2xl px-6 py-24">{children}</main>
      <FooterScene />
    </SceneProvider>
  );
}
