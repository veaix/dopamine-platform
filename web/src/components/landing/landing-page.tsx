"use client";

import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { AccountMockup, ModsMockup, PlayMockup, ServerMockup } from "@/components/landing/mockups";
import { DownloadButton } from "@/components/download-button";
import { SocialLinks } from "@/components/social-links";
import { PageDecor } from "@/components/page-decor";
import { SitePageBackground } from "@/components/site-page-background";
import { useAuth } from "@/components/providers/auth-provider";

type LandingPageProps = {
  releaseTag?: string;
  setupSize?: string;
};

const SHOWCASES = [
  {
    id: "servers",
    tag: "Локальные серверы",
    title: "Поднимай мир для друзей за пару кликов",
    desc: "Слоты, JVM, моды и туннель — без Hamachi и сторонних панелей. Друзья заходят по ссылке из любой сети.",
    Mockup: ServerMockup,
    reverse: false,
  },
  {
    id: "mods",
    tag: "Modrinth",
    title: "Моды и сборки без возни",
    desc: "Forge, Fabric, NeoForge и готовые modpack'и. Поиск, установка и обновление прямо в лаунчере.",
    Mockup: ModsMockup,
    reverse: true,
  },
  {
    id: "account",
    tag: "dopamine.cfd",
    title: "Один аккаунт на сайте и в лаунчере",
    desc: "Профиль, монеты, ключи, друзья и 2FA синхронизируются автоматически — войди тем же email и паролем.",
    Mockup: AccountMockup,
    reverse: false,
  },
  {
    id: "play",
    tag: "Запуск",
    title: "Выбрал версию — нажал «Играть»",
    desc: "Vanilla и модовые установки в одном списке. Лаунчер сам подтянет Java и соберёт команду запуска.",
    Mockup: PlayMockup,
    reverse: true,
  },
] as const;

export function LandingPage({ releaseTag, setupSize }: LandingPageProps) {
  const { user } = useAuth();

  return (
    <main className="landing landing--home">
      <SitePageBackground scene="landing" />
      <PageDecor variant="landing" />
      <section className="landing-hero" id="download">
        <div className="landing-hero-inner">
          <div className="landing-logo-wrap landing-animate landing-animate--1">
            <div className="landing-logo-ring" aria-hidden />
            <div className="landing-logo-frame">
              <Image
                src="/brand-logo.png"
                alt="dopamine"
                width={240}
                height={240}
                className="landing-logo-img"
                priority
              />
            </div>
          </div>

          <p className="landing-eyebrow landing-animate landing-animate--2">Minecraft launcher · Windows</p>
          <h1 className="landing-title landing-animate landing-animate--3">
            Играй <span className="landing-gradient-text">без лишнего</span>
          </h1>
          <p className="landing-lead landing-animate landing-animate--4">
            Серверы для друзей, Modrinth и единый аккаунт — красиво, быстро, без лишнего.
          </p>

          <div className="landing-hero-actions landing-animate landing-animate--5">
            <DownloadButton size="lg" releaseTag={releaseTag} setupSize={setupSize} />
            {user ? (
              <Link href="/dashboard" className="btn secondary btn-download btn-download--lg">
                Кабинет
              </Link>
            ) : (
              <Link href="/register" className="btn secondary btn-download btn-download--lg">
                Регистрация
              </Link>
            )}
          </div>

          <p className="landing-hero-note muted landing-animate landing-animate--6">RU / EN · бесплатно · без рекламы</p>

          <a href="#features" className="landing-scroll-hint landing-animate landing-animate--7" aria-label="Смотреть возможности">
            <span className="landing-scroll-mouse" />
            <span>Листай вниз</span>
          </a>
        </div>
      </section>

      <section className="landing-showcases" id="features">
        {SHOWCASES.map((item) => (
          <ScrollReveal key={item.id} direction={item.reverse ? "right" : "left"}>
            <article className={`landing-showcase${item.reverse ? " landing-showcase--reverse" : ""}`}>
              <ScrollReveal className="landing-showcase-copy" direction="up" delay={80}>
                <span className="landing-showcase-tag">{item.tag}</span>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
              </ScrollReveal>
              <ScrollReveal className="landing-showcase-visual" direction="scale" delay={160}>
                <div className="landing-showcase-frame">
                  <item.Mockup />
                </div>
              </ScrollReveal>
            </article>
          </ScrollReveal>
        ))}
      </section>

      <ScrollReveal>
        <section className="landing-final">
          <div className="landing-final-glow" aria-hidden />
          <h2>Готов играть?</h2>
          <p>Скачай лаунчер и зайди в сообщество dopamine.</p>
          <div className="landing-hero-actions">
            <DownloadButton size="lg" releaseTag={releaseTag} setupSize={setupSize} />
            <Link href="/tops" className="btn secondary btn-download btn-download--lg">
              Топы игроков
            </Link>
          </div>
          <SocialLinks className="landing-final-social" />
        </section>
      </ScrollReveal>
    </main>
  );
}
