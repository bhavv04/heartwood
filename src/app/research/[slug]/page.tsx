import EntryPage from "@/components/EntryPage";
import { getEntries } from "@/lib/content";

export function generateStaticParams() {
  return getEntries("research").map((e) => ({ slug: e.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EntryPage kind="research" slug={slug} />;
}