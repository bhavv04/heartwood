"use client";
import { LuCat } from "react-icons/lu";
import { useCat } from "@/context/CatContext";

export default function CatToggle({ className = "" }: { className?: string }) {
  const { showCat, toggleCat } = useCat();

  return (
    <button
      type="button"
      onClick={toggleCat}
      aria-label={showCat ? "Hide cat" : "Show cat"}
      aria-pressed={showCat}
      className={`${className} ${showCat ? "" : "opacity-50"}`}
    >
      <LuCat size={18} />
    </button>
  );
}
