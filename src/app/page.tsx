import Link from "next/link";
import { site } from "@/content/site";
import { getEntries } from "@/lib/content";
import Section from "@/components/Section";
import SocialLinks from "@/components/SocialLinks";
import EntryList from "@/components/EntryList";
import ConstellationDiagram from "@/components/ConstellationDiagram";
import FooterQuote from "@/components/FooterQuote";

export default function Home() {
  return (
    <>
      <header>
        <h1 className="text-xl font-semibold">{site.name}</h1>
        <p className="text-neutral-500">{site.tagline}</p>
        <SocialLinks />
      </header>

      <p className="my-4">{site.bio}</p>

      <div className="my-4">
        <ConstellationDiagram />
      </div>

      <Section title="Selected Projects">
        <EntryList kind="projects" entries={getEntries("projects")} />
      </Section>

      <Section title="Selected Research">
        <EntryList kind="research" entries={getEntries("research")} />
      </Section>

      <FooterQuote />
    </>
  );
}
