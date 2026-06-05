import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { BRAND_ALTERNATE_NAMES, GLOBAL_SEO_KEYWORDS } from "@/lib/seo-keywords";

export const SEO_KEYWORDS = GLOBAL_SEO_KEYWORDS;
export { BRAND_ALTERNATE_NAMES };

export const SITE_NAME = "dopamine";

export const SITE_TITLE = "dopamine — Minecraft launcher";

export const DEFAULT_DESCRIPTION =
  "dopamine — бесплатный Minecraft launcher для Windows: Modrinth, Fabric, Forge, локальные серверы для друзей и единый аккаунт. Скачать бесплатно.";

export function siteLogoUrl() {
  return `${siteUrl()}/icon-512.png`;
}

export function ogImageMeta() {
  return {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "dopamine — Minecraft launcher",
  };
}

export function canonicalUrl(path = "/") {
  const base = siteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function siteIcons(): Metadata["icons"] {
  return {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  };
}

export function baseMetadata(overrides?: Partial<Metadata>): Metadata {
  const url = siteUrl();
  const ogImage = ogImageMeta();

  return {
    metadataBase: new URL(url),
    title: {
      default: SITE_TITLE,
      template: "%s · dopamine",
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [...SEO_KEYWORDS],
    alternates: { canonical: url },
    icons: siteIcons(),
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [ogImage.url],
    },
    robots: { index: true, follow: true },
    ...overrides,
  };
}

export type SoftwareApplicationJsonLd = {
  version?: string;
  fileSize?: string;
};

export function softwareApplicationJsonLd(opts: SoftwareApplicationJsonLd = {}) {
  const url = siteUrl();
  const logo = siteLogoUrl();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "dopamine",
    alternateName: [...BRAND_ALTERNATE_NAMES],
    applicationCategory: "GameApplication",
    applicationSubCategory: "Minecraft launcher",
    operatingSystem: "Windows 10, Windows 11",
    softwareVersion: opts.version ?? undefined,
    fileSize: opts.fileSize ?? undefined,
    inLanguage: ["ru", "en"],
    image: logo,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
    },
    downloadUrl: `${url}/api/download/windows`,
    installUrl: `${url}/download`,
    url,
    description: DEFAULT_DESCRIPTION,
    publisher: organizationJsonLd(),
  };
}

export function organizationJsonLd() {
  const url = siteUrl();

  return {
    "@type": "Organization",
    name: "dopamine",
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url,
    logo: {
      "@type": "ImageObject",
      url: siteLogoUrl(),
      width: 512,
      height: 512,
    },
  };
}

export function websiteJsonLd() {
  const url = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "dopamine",
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url,
    description: DEFAULT_DESCRIPTION,
    inLanguage: ["ru", "en"],
    publisher: organizationJsonLd(),
  };
}

export function homePageJsonLd(opts: SoftwareApplicationJsonLd = {}) {
  return [websiteJsonLd(), softwareApplicationJsonLd(opts)];
}
