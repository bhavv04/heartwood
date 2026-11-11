export type Kind = "projects" | "research";

export type EntryLink = { label: string; href: string };

export type Entry = {
  slug: string;
  title: string;
  summary: string;
  logo?: string;
  image?: string;
  year: number;
  tags?: string[];
  links?: EntryLink[];
};
