"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const saved = document.documentElement.dataset.theme as Theme | undefined;
    setTheme(
      saved ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
    );
    // enable the slide transition only after the initial position is set
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function choose(next: Theme) {
    if (next === theme) return;
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  const dark = theme === "dark";
  const btn =
    "relative z-10 flex h-5 w-5 items-center justify-center rounded-md transition-colors";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative inline-flex rounded-lg bg-line p-0.5"
    >
      {/* sliding thumb: width must equal translate distance (w-5 = translate-x-5) */}
      <span
        aria-hidden
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-md shadow-sm ${
          animate ? "transition-transform duration-200 ease-out" : ""
        } ${theme === null ? "opacity-0" : ""} ${
          dark ? "translate-x-5 bg-stone-500" : "translate-x-0 bg-white"
        }`}
      />

      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        aria-label="Light"
        title="Light"
        onClick={() => choose("light")}
        className={`${btn} ${
          theme === "light" ? "text-stone-900" : "text-muted hover:text-fg"
        }`}
      >
        <FiSun size={12} />
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        aria-label="Dark"
        title="Dark"
        onClick={() => choose("dark")}
        className={`${btn} ${
          theme === "dark" ? "text-stone-100" : "text-muted hover:text-fg"
        }`}
      >
        <FiMoon size={12} />
      </button>
    </div>
  );
}