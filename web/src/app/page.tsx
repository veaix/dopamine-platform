import Link from "next/link";

const releases =
  process.env.NEXT_PUBLIC_GITHUB_RELEASES ||
  "https://github.com/veaix/dopamine-MinecraftLauncher/releases/latest";

export default function HomePage() {
  return (
    <section className="hero">
      <h1>Minecraft-лаунчер dopamine</h1>
      <p>
        Профили, Fabric/Forge/NeoForge, локальные серверы, Modrinth. Привяжите лаунчер к аккаунту,
        активируйте создание серверов ключом и следите за онлайн-статистикой.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
        <a className="btn btn-primary" href={releases} target="_blank" rel="noreferrer">
          Скачать лаунчер
        </a>
        <Link className="btn" href="/register">
          Создать аккаунт
        </Link>
        <Link className="btn" href="/stats">
          Статистика
        </Link>
      </div>

      <div className="grid-2" style={{ marginTop: "2.5rem" }}>
        <div className="card">
          <div className="label">Аккаунт</div>
          <h3 style={{ marginTop: "0.35rem" }}>Привязка лаунчера</h3>
          <p className="label">
            Код из личного кабинета → Настройки → Аккаунт в лаунчере (см. integration/README).
          </p>
        </div>
        <div className="card">
          <div className="label">Серверы</div>
          <h3 style={{ marginTop: "0.35rem" }}>Ключи активации</h3>
          <p className="label">
            Когда включён режим «только по ключу», создание локальных серверов доступно после
            активации на сайте или в лаунчере.
          </p>
        </div>
      </div>
    </section>
  );
}
