import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { IconType } from "react-icons";
import { FiExternalLink, FiGithub, FiGlobe } from "react-icons/fi";
import { getEntry } from "@/lib/content";
import type { Kind } from "@/lib/types";
import { FiChevronRight } from "react-icons/fi"; 
import Prose from "@/components/Prose";

// keyed by lowercase link label from frontmatter; anything else falls back to FiExternalLink
const LINK_ICONS: Record<string, IconType> = {
  github: FiGithub,
  site: FiGlobe,
  website: FiGlobe,
};

const SECTION_LABELS: Record<string, string> = {
  projects: "Projects",
  research: "Research",
};

export default function EntryPage({ kind, slug }: { kind: Kind; slug: string }) {
  const { meta, content } = getEntry(kind, slug);
    const sectionLabel =
    SECTION_LABELS[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1);

  return (
    <>
    <nav aria-label="Breadcrumb" className="text-sm">
    <ol className="flex items-center gap-1.5">
        <li>
        <Link
            href="/"
            className="text-muted transition-colors duration-200 hover:text-sky-200"
        >
            {sectionLabel}
        </Link>
        </li>
        <li aria-hidden className="text-muted/60">
        <FiChevronRight size={14} />
        </li>
        <li aria-current="page" className="min-w-0 truncate">
        {meta.title}
        </li>
    </ol>
    </nav>

      <h1 className="mt-8 text-2xl font-semibold">{meta.title}</h1>
      <p className="mt-1 text-muted">{meta.summary}</p>

      {meta.links && (
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {meta.links.map((l) => {
            const Icon = LINK_ICONS[l.label.toLowerCase()] ?? FiExternalLink;
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted transition-colors duration-200 hover:text-sky-200"
                >
                  <Icon size={15} aria-hidden />
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10">
        <Prose>
          <MDXRemote source={content} />
        </Prose>
      </div>
    </>
  );
}