export type Kind = "projects" | "research";

export type Entry = {
  slug: string;
  title: string;
  summary: string;
  year: number;
  tags?: string[];
  links?: { label: string; href: string }[];
};