"use client";
import { LuCat } from "react-icons/lu";
import { useCat } from "@/context/CatContext";
import Tip from "@/components/Tip";

export default function CatToggle({ className = "" }: { className?: string }) {
  const { showCat, toggleCat } = useCat();
  const label = showCat ? "Hide cat" : "Show cat";

  return (
    <Tip text={label}>
      <button
        type="button"
        onClick={toggleCat}
        aria-label={label}
        aria-pressed={showCat}
        className={`${className} ${showCat ? "cursor-pointer" : "opacity-50 cursor-pointer"}`}
      >
        <LuCat size={18} />
      </button>
    </Tip>
  );
}
