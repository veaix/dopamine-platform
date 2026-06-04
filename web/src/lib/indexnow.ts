import { siteUrl } from "@/lib/site-url";

import { getAllSeoSlugs, getSeoPagePath } from "@/lib/seo-pages/pages";



export const INDEXNOW_KEY = "d4f8a2b1c3e5d6f7";



const INDEXNOW_ENDPOINTS = [

  "https://yandex.com/indexnow",

  "https://api.indexnow.org/indexnow",

  "https://www.bing.com/indexnow",

] as const;



export async function pingIndexNow(urls: string[]) {

  const host = new URL(siteUrl()).host;

  const keyLocation = `${siteUrl()}/${INDEXNOW_KEY}.txt`;

  const body = { host, key: INDEXNOW_KEY, keyLocation, urlList: urls };



  const results = await Promise.allSettled(

    INDEXNOW_ENDPOINTS.map(async (endpoint) => {

      const res = await fetch(endpoint, {

        method: "POST",

        headers: { "Content-Type": "application/json; charset=utf-8" },

        body: JSON.stringify(body),

      });

      return { endpoint, ok: res.ok, status: res.status };

    }),

  );



  return results.map((r) => (r.status === "fulfilled" ? r.value : { error: String(r.reason) }));

}



export function indexableSiteUrls() {

  const base = siteUrl();

  const seo = getAllSeoSlugs().map((slug) => `${base}${getSeoPagePath(slug)}`);

  return [`${base}/`, `${base}/download`, `${base}/guides`, ...seo];

}

