import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { DownloadButton } from "@/components/download-button";
import { JsonLd } from "@/components/seo/json-ld";
import { getLatestLauncherRelease, formatBytes } from "@/lib/launcher-release";
import { GLOBAL_SEO_KEYWORDS } from "@/lib/seo-keywords";
import { canonicalUrl, ogImageMeta, softwareApplicationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Скачать лаунчер Minecraft для Windows — dopamine",
  description:
    "Скачайте dopamine — бесплатный Minecraft launcher для Windows 10/11. Modrinth, Fabric, Forge, NeoForge, локальные серверы для друзей. Актуальная версия установщика и portable-сборка.",
  keywords: [
    ...GLOBAL_SEO_KEYWORDS.filter((k) =>
      /скачать|download|launcher|лаунчер|dopamine|дофамин/i.test(k),
    ),
  ],
  alternates: { canonical: canonicalUrl("/download") },
  openGraph: {
    title: "Скачать dopamine — Minecraft launcher для Windows",
    description:
      "Бесплатный лаунчер Minecraft: моды, серверы для друзей, автообновления. Скачайте установщик для Windows.",
    url: canonicalUrl("/download"),
    images: [ogImageMeta()],
  },
  twitter: {
    card: "summary_large_image",
    title: "Download dopamine — Minecraft launcher",
    description:
      "Free Minecraft launcher for Windows: Modrinth, Fabric, Forge, local servers. Download the latest installer.",
    images: [ogImageMeta().url],
  },
};

export default async function DownloadPage() {
  const release = await getLatestLauncherRelease();
  const version = release?.tag?.replace(/^v/, "") ?? undefined;
  const setupSize = release ? formatBytes(release.setup.size) : undefined;

  const jsonLd = softwareApplicationJsonLd({
    version,
    fileSize: setupSize,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageShell
        decor="landing"
        tag="Minecraft launcher · Windows"
        title="Скачать лаунчер Minecraft — dopamine"
        subtitle="Бесплатный Minecraft launcher для Windows: моды, локальные серверы и единый аккаунт на www.dopamine.cfd"
        className="page-download"
      >
        <section className="card stack download-hero-card">
          <div className="download-hero-actions">
            <DownloadButton
              variant="primary"
              size="lg"
              releaseTag={release?.tag}
              setupSize={setupSize}
              label="Скачать установщик"
            />
            {release?.portable ? (
              <a href={release.portable.url} className="btn secondary btn-download btn-download--lg">
                <span className="btn-download-icon" aria-hidden>
                  ⬇
                </span>
                <span className="btn-download-body">
                  <span className="btn-download-label">Portable {release.tag}</span>
                  <span className="btn-download-meta">{formatBytes(release.portable.size)}</span>
                </span>
              </a>
            ) : null}
          </div>
          <p className="muted download-note">
            Лаунчер поддерживает автообновление — новые версии подтягиваются с www.dopamine.cfd без
            переустановки.
          </p>
        </section>

        <article className="card stack download-content">
          <h2>Что такое dopamine — Minecraft launcher</h2>
          <p>
            <strong>dopamine</strong> — современный <strong>лаунчер Minecraft</strong> для Windows.
            Если вы ищете альтернативу с Modrinth, Fabric, Forge и NeoForge без лишней возни, dopamine
            собирает установку, Java и моды в одном окне. Это не пиратский клиент: игра запускается с
            вашими профилями в офлайн-режиме или через привычную схему входа.
          </p>

          <h2>Зачем скачивать лаунчер с официального сайта</h2>
          <ul className="download-list">
            <li>Актуальная версия установщика и проверенные обновления</li>
            <li>Modrinth — поиск и установка модов без ручного копирования jar-файлов</li>
            <li>Локальные серверы для друзей: слоты, RAM, туннель без Hamachi</li>
            <li>Единый аккаунт на сайте и в лаунчере — монеты, ключи, 2FA</li>
            <li>Русский и английский интерфейс, тёмная тема, настройка внешнего вида</li>
          </ul>

          <h2>Системные требования</h2>
          <p>
            Windows 10 или 11 (64-bit), от 4 GB RAM для лёгких сборок, 8 GB и выше — для модпаков.
            Лаунчер сам предложит подходящую Java (Temurin) или использует уже установленную.
          </p>

          <h2>Как установить</h2>
          <ol className="download-list download-list--ordered">
            <li>Нажмите «Скачать установщик» на этой странице</li>
            <li>Запустите <code>dopamine-Setup-*.exe</code> и следуйте шагам мастера</li>
            <li>Откройте лаунчер, создайте профиль или войдите в аккаунт dopamine</li>
            <li>Выберите версию Minecraft, при необходимости — Fabric/Forge и моды</li>
          </ol>

          <h2>Minecraft launcher vs другие лаунчеры</h2>
          <p>
            Официальный лаунчер Mojang закрывает базовые нужды, но не даёт удобной работы с modpack&apos;ами
            и локальными серверами «из коробки». dopamine ориентирован на игроков, которым нужен{" "}
            <strong>лаунчер майнкрафт</strong> с Modrinth, несколькими установками и быстрым запуском
            сервера для друзей — без сторонних панелей и сложных настроек.
          </p>

          <div className="download-links row">
            <Link href="/register" className="btn secondary">
              Создать аккаунт
            </Link>
            <Link href="/" className="btn ghost">
              На главную
            </Link>
          </div>
        </article>
      </PageShell>
    </>
  );
}
