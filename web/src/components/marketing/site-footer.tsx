import Link from "next/link";

const releases =
  process.env.NEXT_PUBLIC_GITHUB_RELEASES ||
  "https://github.com/veaix/dopamine-MinecraftLauncher/releases/latest";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <div className="site-logo" style={{ marginBottom: "0.75rem" }}>
            <span className="site-logo__mark">D</span>
            dopamine
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.55, margin: 0 }}>
            Современный Minecraft-лаунчер с локальными серверами, Modrinth и облачным аккаунтом.
          </p>
        </div>
        <div>
          <h4>Лаунчер</h4>
          <ul>
            <li>
              <a href={releases} target="_blank" rel="noreferrer">
                Скачать
              </a>
            </li>
            <li>
              <a
                href="https://github.com/veaix/dopamine-MinecraftLauncher"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Аккаунт</h4>
          <ul>
            <li>
              <Link href="/register">Регистрация</Link>
            </li>
            <li>
              <Link href="/login">Вход</Link>
            </li>
            <li>
              <Link href="/dashboard">Личный кабинет</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Сообщество</h4>
          <ul>
            <li>
              <Link href="/stats">Статистика</Link>
            </li>
            <li>
              <a href="mailto:support@dopamine.cfd">support@dopamine.cfd</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} dopamine</span>
        <span>Minecraft — trademark Mojang / Microsoft</span>
      </div>
    </footer>
  );
}
