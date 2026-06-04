import type { MetadataRoute } from "next";

import { getAllSeoSlugs, getSeoPagePath } from "@/lib/seo-pages/pages";

import { siteUrl } from "@/lib/site-url";



export default function sitemap(): MetadataRoute.Sitemap {

  const base = siteUrl();

  const now = new Date();



  const core: MetadataRoute.Sitemap = [

    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },

    { url: `${base}/download`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },

    { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },

    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },

    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },

    { url: `${base}/tops`, lastModified: now, changeFrequency: "daily", priority: 0.6 },

  ];



  const seo: MetadataRoute.Sitemap = getAllSeoSlugs().map((slug) => ({

    url: `${base}${getSeoPagePath(slug)}`,

    lastModified: now,

    changeFrequency: "monthly" as const,

    priority: 0.85,

  }));



  return [...core, ...seo];

}

