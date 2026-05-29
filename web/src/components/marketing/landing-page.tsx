import Link from "next/link";
import { LiveStats } from "@/components/marketing/live-stats";

const releases =
  process.env.NEXT_PUBLIC_GITHUB_RELEASES ||
  "https://github.com/veaix/dopamine-MinecraftLauncher/releases/latest";

const FEATURES: { icon: string; title: string; text: string; tag?: string }[] = [
  {
    icon: "⚡",
    title: "Быстрый старт",
    text: "Профили, версии Minecraft, Fabric, Forge и NeoForge — всё в пару кликов, без лишней возни.",
  },
  {
    icon: "🖥",
    title: "Локальные серверы",
    text: "Поднимайте свой сервер прямо из лаунчера: консоль, плагины Modrinth, туннель для друзей.",
  },
  {
    icon: "🔑",
    title: "Облачный аккаунт",
    text: "Привяжите лаунчер к dopamine.cfd — ключи активации, лимиты и статистика в одном месте.",
  },
  {
    icon: "📦",
    title: "Modrinth внутри",
    text: "Ищите и ставьте моды и плагины для инстансов и серверов, не выходя из лаунчера.",
  },
  {
    icon: "🎨",
    title: "Светлая и тёмная тема",
    text: "Интерфейс лаунчера и сайта подстраиваются под ваш вкус — как у лучших лаунчеров.",
  },
  {
    icon: "📊",
    title: "Живая статистика",
    text: "Сколько игроков онлайн, сколько серверов запущено — видно на сайте в реальном времени.",
  },
];

const ACCENT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

export function LandingPage() {
  return (
    <>
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <div>
            <div className="landing-badge">
              <span className="landing-badge__dot" />
              v3.7 · Windows · RU / EN
            </div>
            <h1>
              Лаунчер Minecraft,
              <br />
              <span>который не мешает играть</span>
            </h1>
            <p className="landing-hero__lead">
              dopamine — профили, моды, локальные серверы и облачный аккаунт. Скачайте, привяжите
              лаунчер и играйте — без лишних шагов.
            </p>
            <div className="landing-hero__actions">
              <a className="btn btn-primary btn-lg" href={releases} target="_blank" rel="noreferrer">
                Скачать лаунчер
              </a>
              <Link className="btn btn-lg" href="/register">
                Создать аккаунт
              </Link>
            </div>
          </div>

          <div className="landing-hero__visual" aria-hidden>
            <div className="landing-mock">
              <div className="landing-mock__bar">
                <span className="landing-mock__dot" />
                <span className="landing-mock__dot" />
                <span className="landing-mock__dot" />
              </div>
              <div className="landing-mock__card">
                <div className="landing-mock__line landing-mock__line--accent" />
                <div className="landing-mock__line" />
                <div className="landing-mock__line landing-mock__line--short" />
                <div className="landing-mock__stats">
                  <div className="landing-mock__stat">
                    <b>12</b>
                    <span>онлайн</span>
                  </div>
                  <div className="landing-mock__stat">
                    <b>3</b>
                    <span>сервера</span>
                  </div>
                  <div className="landing-mock__stat">
                    <b>RU</b>
                    <span>язык</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="stats">
        <div className="landing-section__title">
          <h2>Сообщество в цифрах</h2>
          <p>Данные обновляются, когда лаунчеры привязаны к аккаунту и онлайн</p>
        </div>
        <LiveStats />
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section__title">
          <h2>Почему dopamine?</h2>
          <p>Всё необходимое — в одном лаунчере и на одном сайте</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              {f.tag && <span className="feature-card__tag">{f.tag}</span>}
            </article>
          ))}
        </div>

        <div className="landing-section__title" style={{ marginTop: "3rem" }}>
          <h2>Хотите — зелёный, синий или розовый?</h2>
          <p>В лаунчере настраивается оформление под ваш вкус</p>
        </div>
        <div className="accent-showcase">
          {ACCENT_COLORS.map((c) => (
            <span key={c} className="accent-chip" style={{ background: c }} title={c} />
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__title">
          <h2>Для админов и создателей</h2>
          <p>Управление доступом к созданию серверов через сайт</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-card__icon">🔗</div>
            <h3>Привязка лаунчера</h3>
            <p>Код из личного кабинета → Настройки → Аккаунт dopamine. Одна минута.</p>
          </article>
          <article className="feature-card">
            <div className="feature-card__icon">🎫</div>
            <h3>Ключи активации</h3>
            <p>Выдавайте ключи DOP-XXXX — открывайте создание серверов выбранным игрокам.</p>
          </article>
          <article className="feature-card">
            <div className="feature-card__icon">🛡</div>
            <h3>Админ-панель</h3>
            <p>Роли, баны, глобальный режим «серверы только по ключу».</p>
            <Link href="/admin" className="btn" style={{ marginTop: "0.75rem" }}>
              Открыть админку
            </Link>
          </article>
        </div>

        <div className="cta-banner">
          <h3>Ещё не скачали dopamine?</h3>
          <p>Бесплатно для Windows. Обновления — через встроенный апдейтер.</p>
          <a className="btn btn-primary btn-lg" href={releases} target="_blank" rel="noreferrer">
            Загрузить лаунчер
          </a>
        </div>
      </section>
    </>
  );
}
