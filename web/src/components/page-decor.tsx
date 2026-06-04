import type { ReactNode } from "react";

export type PageDecorVariant =
  | "login"
  | "register"
  | "verify"
  | "password"
  | "tops"
  | "dashboard"
  | "profile"
  | "admin"
  | "landing";

type PageDecorProps = {
  variant: PageDecorVariant;
};

function DecorStage({ children }: { children: ReactNode }) {
  return (
    <div className="page-decor-stage">
      <span className="page-decor-pedestal" />
      <div className="page-decor-object">{children}</div>
    </div>
  );
}

export function PageDecor({ variant }: PageDecorProps) {
  return (
    <div className={`page-decor page-decor--${variant}`} aria-hidden>
      <DecorStage>
        {variant === "login" && <DecorPortal />}
        {variant === "register" && <DecorCrystal />}
        {variant === "verify" && <DecorMail />}
        {variant === "password" && <DecorLock />}
        {variant === "tops" && <DecorTrophy />}
        {variant === "dashboard" && <DecorServer />}
        {variant === "profile" && <DecorHeart />}
        {variant === "admin" && <DecorShield />}
        {variant === "landing" && <DecorOrbit />}
      </DecorStage>
    </div>
  );
}

/** Вход — портал в мир */
function DecorPortal() {
  return (
    <div className="page-decor-portal-wrap">
      <div className="page-decor-portal">
        <span className="page-decor-portal-frame" />
        <span className="page-decor-portal-vortex" />
        <span className="page-decor-portal-shine" />
      </div>
      <span className="page-decor-portal-particle page-decor-portal-particle--a" />
      <span className="page-decor-portal-particle page-decor-portal-particle--b" />
    </div>
  );
}

/** Регистрация — кристалл / «новый игрок» */
function DecorCrystal() {
  return (
    <div className="page-decor-crystal-wrap page-decor-spin page-decor-spin--tilt">
      <svg className="page-decor-svg page-decor-crystal-svg" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 6 L48 24 L32 58 L16 24 Z"
          fill="url(#decorCrystalFill)"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="miter"
        />
        <path d="M16 24 H48" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        <path d="M32 6 L32 58" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <path d="M22 24 L32 38 L42 24" stroke="var(--accent-bright)" strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
        <defs>
          <linearGradient id="decorCrystalFill" x1="16" y1="6" x2="48" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent-bright)" />
            <stop offset="0.45" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-deep)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="page-decor-crystal-spark" />
    </div>
  );
}

function DecorMail() {
  return (
    <div className="page-decor-bob">
      <svg className="page-decor-svg" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="16" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="3" />
        <path d="M8 20 L32 36 L56 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="20" r="8" fill="var(--accent)" opacity="0.35" />
        <path d="M45 20 L47 22 L51 18" stroke="#031318" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function DecorLock() {
  return (
    <div className="page-decor-orbit-wrap">
      <svg className="page-decor-svg page-decor-lock" viewBox="0 0 64 64" fill="none">
        <rect x="18" y="28" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="3" />
        <path d="M24 28 V22 C24 16.5 28.5 12 34 12 C39.5 12 44 16.5 44 22 V28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="40" r="4" fill="currentColor" />
      </svg>
      <span className="page-decor-orbit-dot" />
    </div>
  );
}

function DecorTrophy() {
  return (
    <div className="page-decor-bob page-decor-bob--slow">
      <svg className="page-decor-svg" viewBox="0 0 64 64" fill="none">
        <path d="M18 18 H46 V28 C46 36 40 42 32 42 C24 42 18 36 18 28 Z" stroke="currentColor" strokeWidth="3" />
        <path d="M18 22 H12 C12 28 14 32 18 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M46 22 H52 C52 28 50 32 46 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 42 V48" stroke="currentColor" strokeWidth="3" />
        <path d="M24 52 H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 48 H36 V52 H28 Z" fill="currentColor" opacity="0.25" />
      </svg>
    </div>
  );
}

function DecorServer() {
  return (
    <div className="page-decor-spin page-decor-spin--tilt">
      <div className="page-decor-server">
        <span className="page-decor-server-led page-decor-server-led--g" />
        <span className="page-decor-server-led page-decor-server-led--y" />
        <span className="page-decor-server-led page-decor-server-led--c" />
        <span className="page-decor-server-body">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

function DecorHeart() {
  return (
    <div className="page-decor-bob page-decor-bob--slow">
      <div className="page-decor-heart-wrap">
        <svg className="page-decor-svg page-decor-heart" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 52 C18 40 8 30 8 20 C8 12 14 8 22 8 C26 8 30 10 32 14 C34 10 38 8 42 8 C50 8 56 12 56 20 C56 30 46 40 32 52 Z"
            fill="url(#decorHeartFill)"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M22 18 L26 24 L32 16 L38 24 L42 18"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="decorHeartFill" x1="8" y1="8" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--accent-bright)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="page-decor-heart-spark page-decor-heart-spark--a" />
        <span className="page-decor-heart-spark page-decor-heart-spark--b" />
      </div>
    </div>
  );
}

function DecorShield() {
  return (
    <div className="page-decor-spin page-decor-spin--reverse">
      <svg className="page-decor-svg" viewBox="0 0 64 64" fill="none">
        <path d="M32 8 L52 16 V32 C52 44 42 52 32 56 C22 52 12 44 12 32 V16 Z" stroke="currentColor" strokeWidth="3" />
        <circle cx="32" cy="30" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" />
        <path d="M32 24 V36 M26 30 H38" stroke="var(--accent-bright)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function DecorOrbit() {
  return (
    <div className="page-decor-orbit-wrap page-decor-orbit-wrap--wide">
      <span className="page-decor-orbit-ring" />
      <span className="page-decor-orbit-core" />
      <span className="page-decor-orbit-dot page-decor-orbit-dot--a" />
      <span className="page-decor-orbit-dot page-decor-orbit-dot--b" />
    </div>
  );
}
