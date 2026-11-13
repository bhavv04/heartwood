export type SocialIcon = "github" | "linkedin" | "resume";

export const site = {
  name: "Bhavdeep Arora 🧸",
  tagline: "Building systems, tools, and research.",
  bio: "I build things across systems programming, machine learning, and data tooling. I also conduct empirical research in applied machine learning, quantitative finance and environmental modeling. I take ideas from experiment to production, with the engineering discipline to make them reliable and the research rigor to know they're right. Most of what's below started as a question I wanted answered.",
  interests:
    "When I'm not working, I'm usually reading fantasy or the classics (currently reading bloody rose by nicholas eames), out trekking or cycling, lifting, or building something in the woodshop.I'm always learning something new, and  I'm curious about the natural world and the cosmos",
  email: "bhavdeepsa@gmail.com",
  socials: [
    {
      label: "GitHub",
      href: "https://github.com/bhavv04",
      icon: "github",
      tip: "where I occasionally do open source stuff",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/bhavdeeparora",
      icon: "linkedin",
      tip: "where I post business updates",
    },
  ] satisfies { label: string; href: string; icon: SocialIcon; tip: string }[],
};
