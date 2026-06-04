import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "dopamine — Minecraft launcher";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #101218 0%, #1c2130 50%, #101218 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={180} height={180} alt="" style={{ marginBottom: 32 }} />
        <div style={{ fontSize: 56, fontWeight: 700, color: "#e8f4f8", marginBottom: 16 }}>dopamine</div>
        <div style={{ fontSize: 32, color: "#b4a8ff" }}>Minecraft launcher for Windows</div>
      </div>
    ),
    { ...size },
  );
}
