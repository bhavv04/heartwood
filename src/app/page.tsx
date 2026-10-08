import Entry from "@/components/Entry";
import { projects, research, type EntryData } from "@/data/entries";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import FooterQuote from "@/components/FooterQuote";
import Divider from "@/components/Divider";

const contact = [
  { label: "email", href: "mailto:bhavdeepsa@gmail.com" },
  { label: "github", href: "https://github.com/bhavv04" },
  { label: "linkedin", href: "https://www.linkedin.com/in/bhavdeeparora/" },
];

function Section({
  title,
  entries,
  showSource = false,
}: {
  title: string;
  entries: EntryData[];
  showSource?: boolean;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {entries.map((entry) => (
          <Entry key={entry.name} entry={entry} showSource={showSource} />
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  return (
    <main className="wrap">
    <nav className="contact">
    {contact.map((item) => (
        <a key={item.label} href={item.href}>
        {item.label}
        </a>
    ))}
    <ThemeToggle />
    </nav>

    <header className="hero">
    <Image
        src="/ProfilePic.jpeg"
        alt="Bhavdeep Arora"
        width={64}
        height={64}
        className="avatar"
        priority
    />
    <div>
        <h1>Bhavdeep Arora</h1>
        <p className="role">Engineer.</p>
    </div>
    </header>

      <p>
        I&rsquo;m a software engineer based in Toronto. I build{" "}
        <strong>systems software</strong>, primarily in <strong>Rust</strong>{" "}
        and <strong>Go</strong>, from network proxies and local-first tools to
        storage and data-processing engines written in C. I also conduct{" "}
        <strong>empirical research</strong> in applied machine learning,
        quantitative finance and environmental modeling, with papers on SSRN.
      </p>

      <Divider />
      <Section title="Projects" entries={projects} />
      <Divider />
      <Section title="Research" entries={research} showSource />
      <Divider />
      <FooterQuote />
    </main>
  );
}