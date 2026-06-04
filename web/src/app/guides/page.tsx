import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SEO_PAGES } from "@/lib/seo-pages/pages";
import { getSeoPagePath } from "@/lib/seo-pages/pages";
import { canonicalUrl, ogImageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Guides — Minecraft launcher, mods, servers",
  description:
    "dopamine guides: minecraft launcher, лаунчер майнкрафт, серверы для друзей, Fabric, Forge, Modrinth, дофамин лаунчер.",
  keywords: [
    "minecraft launcher guide",
    "лаунчер майнкрафт",
    "dopamine guides",
    "minecraft server guide",
  ],
  alternates: { canonical: canonicalUrl("/guides") },
  openGraph: {
    title: "dopamine Guides — Minecraft launcher",
    url: canonicalUrl("/guides"),
    images: [ogImageMeta()],
  },
  robots: { index: true, follow: true },
};

export default function GuidesPage() {
  return (
    <PageShell
      decor="landing"
      tag="guides · SEO"
      title="Guides — dopamine Minecraft launcher"
      subtitle="Страницы по темам: лаунчер, моды, серверы, Fabric, Forge, Modrinth"
      className="page-guides"
    >
      <nav className="card stack seo-guides-list" aria-label="Guides">
        <ul className="seo-related-list seo-guides-ul">
          {SEO_PAGES.map((page) => (
            <li key={page.slug}>
              <Link href={getSeoPagePath(page.slug)}>{page.h1}</Link>
            </li>
          ))}
        </ul>
        <div className="seo-links row">
          <Link href="/download" className="btn">
            Скачать
          </Link>
          <Link href="/" className="btn ghost">
            На главную
          </Link>
        </div>
      </nav>
    </PageShell>
  );
}
