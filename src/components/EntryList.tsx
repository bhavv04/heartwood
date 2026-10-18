import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FiArrowUpRight,
  FiBook,
  FiFileText,
  FiGithub,
  FiGlobe,
} from "react-icons/fi";
import type { Entry, Kind } from "@/lib/types";

// label (lowercased) -> icon; anything unknown falls back to a generic arrow
const ICONS: Record<string, IconType> = {
  github: FiGithub,
  site: FiGlobe,
  website: FiGlobe,
  demo: FiGlobe,
  live: FiGlobe,
  paper: FiFileText,
  pdf: FiFileText,
  docs: FiBook,
};

export default function EntryList({
  kind,
  entries,
}: {
  kind: Kind;
  entries: Entry[];
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&:hover_li:not(:hover)]:opacity-50">
      {entries.map((e) => (
        <li
          key={e.slug}
          className="transition-opacity duration-200 motion-reduce:transition-none"
        >
          <div className="group relative h-full rounded-lg p-3 transition-colors duration-200 hover:bg-white/[0.05] focus-within:bg-white/[0.05] motion-reduce:transition-none">
            {/* image */}
            <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-md bg-white/[0.04]">
              {e.image && (
                <Image
                  src={e.image}
                  alt={e.imageAlt ?? e.title}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  unoptimized={e.image.endsWith(".gif")}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              )}
            </div>

            {/* title + links */}
            <div className="flex items-center justify-between gap-3">
              <h3>
                <Link
                  href={`/${kind}/${e.slug}`}
                  className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-1 focus-visible:after:ring-white/20"
                >
                  {e.title}
                </Link>
              </h3>

              {e.links && e.links.length > 0 && (
                <span className="relative z-10 flex shrink-0 items-center gap-1 text-muted">
                  {e.links.map((l) => {
                    const Icon = ICONS[l.label.toLowerCase()] ?? FiArrowUpRight;
                    return (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={l.label}
                        title={l.label}
                        className="rounded p-1 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                      >
                        <Icon size={16} aria-hidden />
                      </a>
                    );
                  })}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-muted">{e.summary}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
