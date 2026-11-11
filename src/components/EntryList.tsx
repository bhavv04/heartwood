"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { Entry, Kind } from "@/lib/types";

// an entry, plus which folder it came from and an optional image path
export type WorkEntry = Entry & { kind: Kind; image?: string };

const arrowBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-sm bg-line text-muted transition-colors hover:text-fg";

export default function EntryList({ entries }: { entries: WorkEntry[] }) {
  const track = useRef<HTMLUListElement>(null);

  // scroll the row left or right by most of its width
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el)
      el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (entries.length === 0) {
    return <p className="text-sm text-muted">Nothing here yet.</p>;
  }

  return (
    <div>
      <ul
        ref={track}
        className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1 scroll-pl-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {entries.map((e) => (
          <li
            key={`${e.kind}-${e.slug}`}
            className="w-[80%] shrink-0 snap-start sm:w-[26rem]"
          >
            <Link
              href={`/${e.kind}/${e.slug}`}
              className="group relative block aspect-[16/10] overflow-hidden rounded-xl border border-line bg-line"
            >
              {/* image, or a dotted placeholder until you add one */}
              {e.image ? (
                <Image
                  src={e.image}
                  alt={e.title}
                  fill
                  sizes="(min-width: 640px) 26rem, 80vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-muted/70"
                  style={{
                    backgroundImage:
                      "radial-gradient(currentColor 1px, transparent 1.2px)",
                    backgroundSize: "8px 8px",
                  }}
                >
                  <span className="rounded-sm bg-bg/80 px-2 py-1 text-xs">
                    project image
                  </span>
                </div>
              )}

              {/* title along the bottom */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/65 to-transparent px-4 pb-3 pt-10 text-white">
                <span className="truncate rounded-xl bg-neutral-800 px-2 text-xs">
                  {e.title}
                </span>
                <FiArrowUpRight size={16} aria-hidden className="shrink-0" />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end gap-2 px-2">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scroll(-1)}
          className={arrowBtn}
        >
          <FiChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scroll(1)}
          className={arrowBtn}
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
