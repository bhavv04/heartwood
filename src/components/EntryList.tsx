import Image from "next/image";
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
    <ul className="flex flex-col gap-2">
      {entries.map((e) => {
        const logo = e.logo ?? `/projects/${e.slug}.png`;

        return (
          <li key={e.slug}>
            <div className="group relative flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-white/5 focus-within:bg-white/5">
              {/* logo tile */}
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
                <Image
                  src={logo}
                  alt={`${e.title} logo`}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>

              {/* title + summary */}
              <div className="min-w-0">
                <h3>
                  {/* the ::after stretches the link over the whole row */}
                  <Link
                    href={`/${kind}/${e.slug}`}
                    className="flex items-center gap-1 after:absolute after:inset-0"
                  >
                    {e.title}
                    <FiArrowUpRight
                      size={14}
                      aria-hidden
                      className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    />
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-muted">{e.summary}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
