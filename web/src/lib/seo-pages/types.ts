export type SeoSection = {
  h2: string;
  paragraphs: string[];
  list?: string[];
  ordered?: boolean;
};

export type SeoFaqItem = {
  q: string;
  a: string;
};

export type SeoPageConfig = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  subtitle: string;
  tag?: string;
  sections: SeoSection[];
  faq: SeoFaqItem[];
  relatedSlugs: string[];
};
