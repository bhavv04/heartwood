export type SocialIcon = "github" | "linkedin" | "resume";

export const site = {
  name: "Bhavdeep Arora",
  tagline: "Building systems, tools, and research.",
  bio: "I build things across systems programming, machine learning, and data tooling. I also conduct empirical research in applied machine learning, quantitative finance and environmental modeling, with papers on SSRN/arXiv. I take ideas from experiment to production, with the engineering discipline to make them reliable and the research rigor to know they're right. Most of what's below started as a question I wanted answered.",
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
    {
      label: "Resume",
      href: "/resume.pdf",
      icon: "resume",
      tip: "My resume (PDF)",
    },
  ] satisfies { label: string; href: string; icon: SocialIcon; tip: string }[],
};
