import { site } from "@/content/site";
import { getEntries } from "@/lib/content";
import Section from "@/components/Section";
import SocialLinks from "@/components/SocialLinks";
import EntryList, { type WorkEntry } from "@/components/EntryList";
import ConstellationDiagram from "@/components/ConstellationDiagram";
import FooterQuote from "@/components/FooterQuote";
import { FaTools, FaRegClock } from "react-icons/fa";
import Image from "next/image";
import Now from "@/components/Now";

export default function Home() {
  const work: WorkEntry[] = [
    ...getEntries("projects").map((e) => ({ ...e, kind: "projects" as const })),
    ...getEntries("research").map((e) => ({ ...e, kind: "research" as const })),
  ];

  return (
    <>
      <header className="-mt-16">
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

      <p className="my-4">{site.bio}</p>

      <div className="my-4">
        <ConstellationDiagram />
      </div>

      <Section title="Selected Work" icon={<FaTools size={21} aria-hidden />}>
        <EntryList entries={work} />
      </Section>

      <Section title="Now" icon={<FaRegClock size={21} aria-hidden />}>
        <Now />
      </Section>

      <FooterQuote />
    </>
  );
}
