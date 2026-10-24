export default function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="my-16">
      <div className="mb-4 flex items-center gap-4 text-muted px-2">
        <h2 className="flex shrink-0 items-center gap-2">
          {icon}
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
