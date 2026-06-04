import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { DownloadButton } from "@/components/download-button";
import { JsonLd } from "@/components/seo/json-ld";
import type { SeoPageConfig } from "@/lib/seo-pages/types";
import { getSeoPage, getSeoPagePath } from "@/lib/seo-pages/pages";
import { breadcrumbJsonLd, faqJsonLd, seoPageMetadata } from "@/lib/seo-pages/helpers";

type SeoContentPageProps = {
  page: SeoPageConfig;
  releaseTag?: string;
  setupSize?: string;
};

export function SeoContentPage({ page, releaseTag, setupSize }: SeoContentPageProps) {
  const related = page.relatedSlugs
    .map((slug) => getSeoPage(slug))
    .filter((p): p is SeoPageConfig => Boolean(p));

  const jsonLd = [breadcrumbJsonLd(page), faqJsonLd(page)].filter(Boolean) as Record<string, unknown>[];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageShell
        decor="landing"
        tag={page.tag}
        title={page.h1}
        subtitle={page.subtitle}
        className="page-seo"
      >
        <section className="card stack seo-hero-card">
          <DownloadButton
            variant="primary"
            size="lg"
            releaseTag={releaseTag}
            setupSize={setupSize}
            label="Скачать dopamine"
          />
          <p className="muted seo-note">
            Официальный Minecraft launcher для Windows ·{" "}
            <Link href="/download">страница загрузки</Link>
          </p>
        </section>

        <article className="card stack seo-content">
          {page.sections.map((section) => (
            <section key={section.h2}>
              <h2>{section.h2}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
              {section.list?.length ? (
                section.ordered ? (
                  <ol className="seo-list seo-list--ordered">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="seo-list">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )
              ) : null}
            </section>
          ))}

          {page.faq.length > 0 ? (
            <section className="seo-faq">
              <h2>Частые вопросы</h2>
              {page.faq.map((item) => (
                <div key={item.q} className="seo-faq-item">
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </section>
          ) : null}

          {related.length > 0 ? (
            <nav className="seo-related" aria-label="Похожие темы">
              <h2>Смотрите также</h2>
              <ul className="seo-related-list">
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <Link href={getSeoPagePath(rel.slug)}>{rel.h1}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="seo-links row">
            <Link href="/" className="btn ghost">
              На главную
            </Link>
            <Link href="/register" className="btn secondary">
              Создать аккаунт
            </Link>
          </div>
        </article>
      </PageShell>
    </>
  );
}

export { seoPageMetadata };
