type Align = "start" | "center" | "end";

const position: Record<Align, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

export default function Tip({
  text,
  align = "center",
  children,
}: {
  text: string;
  align?: Align;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-20 mt-1 whitespace-nowrap rounded-md bg-line bg-bg px-2 py-1 text-xs text-fg opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${position[align]}`}
      >
        {text}
      </span>
    </span>
  );
}