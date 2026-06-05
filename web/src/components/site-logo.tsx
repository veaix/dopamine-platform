import Image from "next/image";
import Link from "next/link";

type SiteLogoProps = {
  href?: string;
  link?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
  showImage?: boolean;
  showText?: boolean;
  className?: string;
};

const SIZES = {
  sm: { w: 28, h: 28, text: "0.95rem" },
  md: { w: 36, h: 36, text: "1.05rem" },
  lg: { w: 52, h: 52, text: "1.2rem" },
  hero: { w: 160, h: 160, text: "1.35rem" },
} as const;

export function SiteLogo({
  href = "/",
  link = true,
  size = "md",
  showImage = true,
  showText = true,
  className = "",
}: SiteLogoProps) {
  const dim = SIZES[size];
  const inner = (
    <>
      {showImage ? (
        <span className="site-logo-frame" style={{ width: dim.w, height: dim.h }}>
          <Image
            src="/brand-logo.png"
            alt=""
            width={dim.w}
            height={dim.h}
            className="site-logo-img"
            priority={size === "hero"}
            aria-hidden
          />
        </span>
      ) : null}
      {showText ? <span className="site-logo-text">dopamine</span> : null}
    </>
  );

  const cls = `site-logo site-logo--${size} ${className}`.trim();

  if (link) {
    return (
      <Link href={href} className={cls} style={{ fontSize: dim.text }}>
        {inner}
      </Link>
    );
  }

  return (
    <span className={cls} style={{ fontSize: dim.text }}>
      {inner}
    </span>
  );
}
