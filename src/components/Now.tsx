import { FiBook, FiCode, FiHeadphones, FiArrowUpRight } from "react-icons/fi";

const now = [
  {
    label: "Reading",
    value: "Bloody Rose - Nicholas Eames",
    icon: FiBook,
    href: "https://www.goodreads.com/book/show/35052265",
  },
  {
    label: "Working on",
    value: "Thunderhead",
    icon: FiCode,
    href: "https://www.thunderhead.network/",
  },
  {
    label: "Listening to",
    value: "Talk - Hozier",
    icon: FiHeadphones,
    href: "https://open.spotify.com/track/6ctlpLPyLH3R1V16fxoOWE?si=d45a9902f8124a31",
  },
];

export default function Now() {
  return (
    <ul className="w-full overflow-hidden rounded-xl">
      {now.map(({ label, value, icon: Icon, href }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-baseline gap-2 p-2 transition-colors hover:text-fg"
          >
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted transition-colors group-hover:text-fg">
              <Icon size={16} aria-hidden />
              {label}
            </span>
            <span
              aria-hidden
              className="min-w-4 flex-1 border-b border-dotted border-muted/50"
            />
            <span className="flex min-w-0 items-center gap-1 text-sm font-medium">
              <span className="truncate">{value}</span>
              <FiArrowUpRight
                size={14}
                aria-hidden
                className="shrink-0 text-muted group-hover:text-fg"
              />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
