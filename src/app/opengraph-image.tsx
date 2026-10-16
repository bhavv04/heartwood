import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = "Heartwood";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#0c0a09",
          color: "#e7e5e4",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 600 }}>{site.name}</div>
        <div style={{ fontSize: 36, marginTop: 24, color: "#a8a29e" }}>
          {site.tagline}
        </div>
      </div>
    ),
    size,
  );
}