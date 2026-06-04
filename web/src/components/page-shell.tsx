import type { ReactNode } from "react";
import { PageDecor, type PageDecorVariant } from "@/components/page-decor";
import { SitePageBackground, type SitePageScene } from "@/components/site-page-background";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
  title?: string;
  subtitle?: string;
  tag?: string;
  decor?: PageDecorVariant;
};

export function PageShell({
  children,
  className = "",
  narrow = false,
  title,
  subtitle,
  tag,
  decor,
}: PageShellProps) {
  const hasHead = Boolean(title || subtitle || tag);
  const scene: SitePageScene = decor ?? "default";

  return (
    <main
      className={`site-page site-page--${scene} page page-enter${narrow ? " page-narrow" : ""}${className ? ` ${className}` : ""}`}
    >
      <SitePageBackground scene={scene} />
      {decor ? <PageDecor variant={decor} /> : null}
      <div className="site-page-inner">
        {hasHead ? (
          <header className="site-page-head page-enter-head">
            {tag ? <span className="site-page-tag page-enter-chip">{tag}</span> : null}
            {title ? <h1 className="page-title page-enter-title">{title}</h1> : null}
            {subtitle ? <p className="site-page-sub muted page-enter-sub">{subtitle}</p> : null}
          </header>
        ) : null}
        <div className={`page-enter-body page-stagger${hasHead ? "" : " page-stagger--solo"}`}>{children}</div>
      </div>
    </main>
  );
}
