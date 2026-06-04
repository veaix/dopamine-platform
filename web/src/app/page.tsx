import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getLatestLauncherRelease, formatBytes } from "@/lib/launcher-release";
import { canonicalUrl, homePageJsonLd, ogImageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  title: "dopamine — Minecraft launcher",
  description:
    "dopamine — бесплатный Minecraft launcher для Windows: Modrinth, Fabric, Forge, локальные серверы для друзей. Скачать бесплатно.",
  keywords: [
    "minecraft launcher",
    "лаунчер майнкрафт",
    "майнкрафт лаунчер",
    "dopamine",
    "дофамин",
    "dopamine launcher",
  ],
  alternates: { canonical: canonicalUrl("/") },
  openGraph: {
    title: "dopamine — Minecraft launcher",
    description:
      "Free Minecraft launcher for Windows: Modrinth mods, Fabric, Forge, local servers for friends.",
    url: canonicalUrl("/"),
    images: [ogImageMeta()],
  },
};

export default async function HomePage() {
  const release = await getLatestLauncherRelease();
  const version = release?.tag?.replace(/^v/, "");
  const setupSize = release ? formatBytes(release.setup.size) : undefined;

  return (
    <>
      <JsonLd
        data={homePageJsonLd({
          version,
          fileSize: setupSize,
        })}
      />
      <LandingPage releaseTag={release?.tag} setupSize={setupSize} />
    </>
  );
}
