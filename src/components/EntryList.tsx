"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { Entry, Kind } from "@/lib/types";

export type WorkEntry = Entry & { kind: Kind; image?: string };

export default function EntryList({ entries }: { entries: WorkEntry[] }) {
  const row = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) =>
    row.current?.scrollBy({
      left: dir * row.current.clientWidth * 0.8,
      behavior: "smooth",
    });

  if (!entries.length) {
    return <p className="text-sm text-muted">Nothing here yet.</p>;
  }

  return (
    <div>
      <ul
        ref={row}
        className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 scroll-pl-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {entries.map((e) => (
          <li
            key={`${e.kind}-${e.slug}`}
            className="w-[80%] shrink-0 snap-start sm:w-[26rem]"
          >
            <Link
              href={`/${e.kind}/${e.slug}`}
              className="relative block aspect-[16/10] overflow-hidden rounded-xl border border-line bg-line"
            >
              {e.image ? (
                <Image
                  src={e.image}
                  alt={e.title}
                  fill
                  sizes="(min-width: 640px) 26rem, 80vw"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-xs text-muted">
                  project image
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-3 pt-10 text-white">
                <span className="truncate text-xs bg-stone-700 px-2 rounded-xl">
                  {e.title}
                </span>
                <FiArrowUpRight size={16} aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end gap-2 px-2">
        {[
          { label: "Previous", dir: -1, Icon: FiChevronLeft },
          { label: "Next", dir: 1, Icon: FiChevronRight },
        ].map(({ label, dir, Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => scroll(dir as 1 | -1)}
            className="grid h-8 w-8 place-items-center rounded-sm bg-line text-muted transition-colors hover:text-fg"
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
