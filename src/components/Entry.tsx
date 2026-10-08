import type { EntryData } from "@/data/entries";

function sourceLabel(href: string) {
  const host = new URL(href).hostname;
  if (host.includes("ssrn")) return "SSRN";
  if (host.includes("gist")) return "Gist";
  if (host.includes("github")) return "GitHub";
  return null;
}

export default function Entry({
  entry,
  showSource = false,
}: {
  entry: EntryData;
  showSource?: boolean;
}) {
  const source = showSource ? sourceLabel(entry.href) : null;

  return (
    <li>
      <a href={entry.href} target="_blank" rel="noopener noreferrer">
        {entry.name}
      </a>
      <span className="entry-line"> — {entry.line}</span>
      {source && <span className="entry-tag">{source}</span>}
    </li>
  );
}