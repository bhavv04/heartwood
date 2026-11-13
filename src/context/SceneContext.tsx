"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createEngine, type Theme } from "@/lib/scene/engine";

const Ctx = createContext<{
  engine: ReturnType<typeof createEngine>;
  theme: Theme;
} | null>(null);
export const useScene = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useScene must be used inside <SceneProvider>");
  return c;
};

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document === "undefined"
      ? "dark"
      : (document.documentElement.dataset.theme as Theme) || "dark",
  );
  const [engine] = useState(() => createEngine(theme, setTheme));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  return <Ctx.Provider value={{ engine, theme }}>{children}</Ctx.Provider>;
}
