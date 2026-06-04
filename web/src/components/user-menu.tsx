"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AvatarImg } from "@/components/avatar-img";

type IncomingPreview = { requestId: string; nickname: string };

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [incoming, setIncoming] = useState<IncomingPreview[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const isStaff = user?.role === "creator" || user?.role === "admin";

  useEffect(() => {
    if (!open || !user) return;
    void fetch("/api/friends/incoming-preview")
      .then((r) => r.json())
      .then((d) => {
        setIncoming((d.incoming ?? []).slice(0, 5));
      });
  }, [open, user]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) return null;

  const initial = user.nickname[0]?.toUpperCase() ?? "?";

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <AvatarImg userId={user.id} nickname={user.nickname} size="md" />
        <span className="user-menu-name">{user.nickname}</span>
        <span className="user-menu-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-head">
            <strong>{user.nickname}</strong>
            <span className="muted">
              {user.coinsBalance} монет · {user.availableServerSlots} слотов
            </span>
          </div>

          {incoming.length > 0 ? (
            <div className="user-menu-section">
              <p className="user-menu-label">Заявки в друзья</p>
              <ul className="user-menu-mini-list">
                {incoming.map((r) => (
                  <li key={r.requestId}>
                    <Link href="/dashboard?tab=friends" onClick={() => setOpen(false)}>
                      {r.nickname}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <nav className="user-menu-links">
            <Link href={`/u/${user.nickname}`} role="menuitem" onClick={() => setOpen(false)}>
              Мой профиль
            </Link>
            <Link href="/dashboard" role="menuitem" onClick={() => setOpen(false)}>
              Личный кабинет
            </Link>
            <Link href="/dashboard?tab=friends" role="menuitem" onClick={() => setOpen(false)}>
              Друзья и заявки
            </Link>
            <Link href="/tops" role="menuitem" onClick={() => setOpen(false)}>
              Топы игроков
            </Link>
            <a href="/api/download/windows" role="menuitem" onClick={() => setOpen(false)}>
              Скачать лаунчер
            </a>
            {isStaff ? (
              <Link href="/admin" role="menuitem" className="accent" onClick={() => setOpen(false)}>
                Админ-панель
              </Link>
            ) : null}
          </nav>

          <button type="button" className="user-menu-logout" onClick={() => void logout()}>
            Выйти
          </button>
        </div>
      ) : null}
    </div>
  );
}
