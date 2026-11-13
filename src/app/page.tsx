import { site } from "@/content/site";
import { getEntries } from "@/lib/content";
import Section from "@/components/Section";
import SocialLinks from "@/components/SocialLinks";
import EntryList, { type WorkEntry } from "@/components/EntryList";
import ConstellationDiagram from "@/components/ConstellationDiagram";
import FooterQuote from "@/components/FooterQuote";
import { FaTools } from "react-icons/fa";
import Image from "next/image";

export default function Home() {
  const work: WorkEntry[] = [
    ...getEntries("projects").map((e) => ({ ...e, kind: "projects" as const })),
    ...getEntries("research").map((e) => ({ ...e, kind: "research" as const })),
  ];

  return (
    <>
      <header className="">
        <Image
          src="/picture.jpeg"
          alt={site.name}
          width={96}
          height={96}
          priority
          className="mb-4 h-12 w-12 rounded-lg object-cover bg-white"
        />
        <h1 className="text-xl font-semibold">{site.name}</h1>
        <p className="text-muted">{site.tagline}</p>
        <SocialLinks />
      </header>

      <div className="my-4 space-y-4">
        <p>{site.bio}</p>
        <p className="">
          When I&apos;m not working, I&apos;m usually reading fantasy or the
          classics (currently reading{" "}
          <a
            href="https://www.goodreads.com/book/show/35052265"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline decoration-muted/70 underline-offset-4 transition-colors hover:decoration-fg"
          >
            Bloody Rose by Nicholas Eames
          </a>
          ), out trekking or cycling, lifting, or building something in the
          woodshop. I&apos;m always learning something new, and I&apos;m
          naturally curious about the nature and the cosmos.
        </p>
      </div>

      <div className="my-4">
        <ConstellationDiagram />
      </div>

      <Section title="Selected Work" icon={<FaTools size={21} aria-hidden />}>
        <EntryList entries={work} />
      </Section>

      <FooterQuote />
    </>
  );
}
