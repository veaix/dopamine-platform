import type { Metadata } from "next";
import type { SeoPageConfig } from "@/lib/seo-pages/types";
import { canonicalUrl, ogImageMeta } from "@/lib/seo";
import { getSeoPagePath } from "@/lib/seo-pages/pages";
import { siteUrl } from "@/lib/site-url";

export function seoPageMetadata(page: SeoPageConfig): Metadata {
  const path = getSeoPagePath(page.slug);
  const url = canonicalUrl(path);

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      images: [ogImageMeta()],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [ogImageMeta().url],
    },
  };
}

export function breadcrumbJsonLd(page: SeoPageConfig) {
  const base = siteUrl();
  const path = getSeoPagePath(page.slug);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "dopamine", item: base },
      { "@type": "ListItem", position: 2, name: page.h1, item: `${base}${path}` },
    ],
  };
}

export function faqJsonLd(page: SeoPageConfig) {
  if (page.faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
