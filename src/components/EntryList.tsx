import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import type { Entry, Kind } from "@/lib/types";

export default function EntryList({
  kind,
  entries,
}: {
  kind: Kind;
  entries: Entry[];
}) {
  return (
    // while any row is hovered, every other row dims
    <ul className="[&:hover_li:not(:hover)]:opacity-50">
      {entries.map((e) => (
        <li key={e.slug} className="transition-opacity duration-200 motion-reduce:transition-none">
          <Link
            href={`/${kind}/${e.slug}`}
            className="group -mx-3 flex items-baseline justify-between gap-6 rounded-lg px-3 py-4 transition-colors duration-200 hover:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 motion-reduce:transition-none"
          >
            <div>
              <h3>{e.title}</h3>
              <p className="text-sm text-muted">{e.summary}</p>
            </div>

            <span className="flex shrink-0 items-center gap-1.5 text-sm tabular-nums text-muted">
              {e.year}
              <FiArrowUpRight
                size={14}
                aria-hidden
                className="-translate-x-1 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}