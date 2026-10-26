import { site } from "@/content/site";
import { getEntries } from "@/lib/content";
import Section from "@/components/Section";
import SocialLinks from "@/components/SocialLinks";
import EntryList from "@/components/EntryList";
import ConstellationDiagram from "@/components/ConstellationDiagram";
import FooterQuote from "@/components/FooterQuote";
import { FaTools } from "react-icons/fa";
import { GiMountainClimbing } from "react-icons/gi";
import ProfileCarousel from "@/components/ProfileCarousel";

export default function Home() {
  return (
    <>
      <div className="flex items-center gap-8">
        <ProfileCarousel />
        <header className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{site.name}</h1>
          <p className="text-neutral-500">{site.tagline}</p>
          <SocialLinks />
        </header>
      </div>

      <p className="my-4">{site.bio}</p>

      <div className="my-4">
        <ConstellationDiagram />
      </div>

      <Section
        title="Selected Projects"
        icon={<FaTools size={21} aria-hidden />}
      >
        <EntryList kind="projects" entries={getEntries("projects")} />
      </Section>

      <Section
        title="Selected Research"
        icon={<GiMountainClimbing size={24} aria-hidden />}
      >
        <EntryList kind="research" entries={getEntries("research")} />
      </Section>

      <FooterQuote />
    </>
  );
}
