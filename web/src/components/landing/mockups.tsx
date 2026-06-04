type MockupProps = {
  className?: string;
};

function MockupShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mockup-shell ${className}`.trim()} aria-hidden>
      <div className="mockup-titlebar">
        <span className="mockup-dot mockup-dot--r" />
        <span className="mockup-dot mockup-dot--y" />
        <span className="mockup-dot mockup-dot--g" />
        <span className="mockup-title">dopamine</span>
      </div>
      <div className="mockup-body">{children}</div>
    </div>
  );
}

export function ServerMockup({ className = "" }: MockupProps) {
  return (
    <MockupShell className={`mockup--server ${className}`.trim()}>
      <aside className="mockup-rail">
        <span className="mockup-rail-item mockup-rail-item--active">Сервер</span>
        <span className="mockup-rail-item">Моды</span>
        <span className="mockup-rail-item">Игра</span>
      </aside>
      <div className="mockup-main">
        <div className="mockup-card mockup-card--glow">
          <div className="mockup-row">
            <strong>Survival с друзьями</strong>
            <span className="mockup-pill mockup-pill--live">ONLINE</span>
          </div>
          <div className="mockup-stat-row">
            <span>1.21.4 · Fabric</span>
            <span>4 GB RAM</span>
          </div>
          <div className="mockup-tunnel">
            <span className="mockup-tunnel-label">Туннель</span>
            <code>play.dopamine.cfd/a8f2…</code>
          </div>
          <button type="button" className="mockup-btn mockup-btn--primary">
            Запустить сервер
          </button>
        </div>
        <div className="mockup-console">
          <p className="mockup-console-line mockup-console-line--ok">[Server] Done (3.2s)!</p>
          <p className="mockup-console-line">[Tunnel] Ссылка для друзей активна</p>
          <p className="mockup-console-line mockup-console-line--dim">Player123 joined the game</p>
        </div>
      </div>
    </MockupShell>
  );
}

export function ModsMockup({ className = "" }: MockupProps) {
  return (
    <MockupShell className={`mockup--mods ${className}`.trim()}>
      <div className="mockup-main mockup-main--full">
        <div className="mockup-search">Поиск на Modrinth…</div>
        <div className="mockup-mod-grid">
          {[
            { name: "Sodium", color: "#f59e0b" },
            { name: "Iris", color: "#8b5cf6" },
            { name: "Fabric API", color: "#22c55e" },
            { name: "Mod Menu", color: "#06b6d4" },
          ].map((mod) => (
            <div key={mod.name} className="mockup-mod-card">
              <span className="mockup-mod-icon" style={{ background: mod.color }} />
              <div>
                <strong>{mod.name}</strong>
                <span>Установлено</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mockup-import">
          <span>Импорт modpack по ссылке</span>
          <button type="button" className="mockup-btn mockup-btn--ghost">
            Вставить URL
          </button>
        </div>
      </div>
    </MockupShell>
  );
}

export function AccountMockup({ className = "" }: MockupProps) {
  return (
    <MockupShell className={`mockup--account ${className}`.trim()}>
      <div className="mockup-main mockup-main--full mockup-account">
        <div className="mockup-profile">
          <span className="mockup-avatar">D</span>
          <div>
            <strong>DopamineUser</strong>
            <span>dopamine.cfd · 2FA вкл.</span>
          </div>
        </div>
        <div className="mockup-stats">
          <div className="mockup-stat">
            <span>Монеты</span>
            <strong>1 240</strong>
          </div>
          <div className="mockup-stat">
            <span>Слоты серверов</span>
            <strong>3</strong>
          </div>
          <div className="mockup-stat">
            <span>Друзья</span>
            <strong>12</strong>
          </div>
        </div>
        <div className="mockup-friends">
          <span>Заявки в друзья</span>
          <div className="mockup-friend-row">
            <span className="mockup-avatar mockup-avatar--sm">A</span>
            <span>AlexCraft</span>
            <button type="button" className="mockup-btn mockup-btn--tiny">
              Принять
            </button>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

export function PlayMockup({ className = "" }: MockupProps) {
  return (
    <MockupShell className={`mockup--play ${className}`.trim()}>
      <aside className="mockup-rail">
        <span className="mockup-rail-item mockup-rail-item--active">Игра</span>
        <span className="mockup-rail-item">Моды</span>
        <span className="mockup-rail-item">Сервер</span>
      </aside>
      <div className="mockup-main mockup-play">
        <div className="mockup-version-pick">
          <span>Версия</span>
          <strong>1.21.4</strong>
          <span className="mockup-pill">Fabric</span>
        </div>
        <button type="button" className="mockup-play-btn">
          ИГРАТЬ
        </button>
        <ul className="mockup-install-list">
          <li className="mockup-install-item mockup-install-item--active">
            <span>1.21.4-fabric</span>
            <span>Modded</span>
          </li>
          <li className="mockup-install-item">
            <span>1.20.1-forge</span>
            <span>Forge</span>
          </li>
          <li className="mockup-install-item">
            <span>1.21.4</span>
            <span>Vanilla</span>
          </li>
        </ul>
      </div>
    </MockupShell>
  );
}
