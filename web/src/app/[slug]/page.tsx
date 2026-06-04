import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoContentPage } from "@/components/seo/seo-content-page";
import { getAllSeoSlugs, getSeoPage } from "@/lib/seo-pages/pages";
import { seoPageMetadata } from "@/lib/seo-pages/helpers";
import { getLatestLauncherRelease, formatBytes } from "@/lib/launcher-release";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) return {};
  return seoPageMetadata(page);
}

export default async function SeoSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) notFound();

  const release = await getLatestLauncherRelease();
  const setupSize = release ? formatBytes(release.setup.size) : undefined;

  return (
    <SeoContentPage page={page} releaseTag={release?.tag} setupSize={setupSize} />
  );
}
