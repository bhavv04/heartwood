import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Entry, Kind } from "./types";

const root = path.join(process.cwd(), "src", "content");

export function getEntries(kind: Kind): Entry[] {
  const dir = path.join(root, kind);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      return { slug: f.replace(/\.mdx$/, ""), ...data } as Entry;
    })
    .sort((a, b) => b.year - a.year);
}

export function getEntry(kind: Kind, slug: string) {
  const file = path.join(root, kind, `${slug}.mdx`);
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { meta: { slug, ...data } as Entry, content };
}