import type { PageDecorVariant } from "@/components/page-decor";

export type SitePageScene = PageDecorVariant | "default";

type SitePageBackgroundProps = {
  scene?: SitePageScene;
};

/** Landing-style grid + orbs; `scene` tweaks colors and orb positions per page. */
export function SitePageBackground({ scene = "default" }: SitePageBackgroundProps) {
  return (
    <div className={`site-page-bg site-page-bg--${scene}`} aria-hidden>
      <span className="site-page-grid" />
      <span className="site-page-orb site-page-orb--1" />
      <span className="site-page-orb site-page-orb--2" />
      <span className="site-page-orb site-page-orb--3" />
    </div>
  );
}
