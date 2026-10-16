import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bhavdeeparora.dev",
      lastModified: new Date(),
    },
  ];
}