"use client";

import { useState } from "react";
import { NICKNAME_MAX_LENGTH } from "@/lib/nickname";
import type { DashboardUser } from "@/server/dashboard/profile";

export function ProfileEditPanel({ me, onUpdated }: { me: DashboardUser; onUpdated: () => void }) {
  const [nickname, setNickname] = useState(me.nickname);
  const [bio, setBio] = useState(me.bio ?? "");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadAvatar(file: File) {
    if (file.size > 220_000) {
      setError("Файл слишком большой (макс. ~200 KB)");
      return;
    }
    setBusy(true);
    setError("");
    setMsg("");
    const reader = new FileReader();
    reader.onerror = () => {
      setError("Не удалось прочитать файл");
      setBusy(false);
    };
    reader.onload = () => {
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: reader.result }),
      })
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) setError(d.error ?? "Ошибка загрузки");
          else {
            setMsg("Аватар обновлён");
            onUpdated();
          }
        })
        .finally(() => setBusy(false));
    };
    reader.readAsDataURL(file);
  }

  async function saveBio() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Ошибка");
      else {
        setMsg("Описание сохранено");
        onUpdated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function changeNickname() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await fetch("/api/me/change-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Ошибка");
      else {
        setMsg(`Ник изменён на «${d.nickname}» (−${d.coinsSpent} монет)`);
        onUpdated();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      {error ? <p className="error">{error}</p> : null}
      {msg ? <p className="info">{msg}</p> : null}

      <section className="card dash-panel">
        <h2>Аватар</h2>
        <div className="dash-avatar-edit">
          {me.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt="" className="avatar xl" />
          ) : (
            <div className="avatar xl placeholder">{me.nickname[0]?.toUpperCase()}</div>
          )}
          <label className="btn secondary file">
            {busy ? "Загрузка…" : "Загрузить новый аватар"}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
          </label>
          <button
            type="button"
            className="btn ghost sm"
            disabled={busy || !me.avatarUrl}
            onClick={() =>
              void fetch("/api/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: null }),
              }).then(async (r) => {
                const d = await r.json();
                if (!r.ok) setError(d.error ?? "Ошибка");
                else {
                  setMsg("Аватар удалён");
                  onUpdated();
                }
              })
            }
          >
            Удалить аватар
          </button>
        </div>
      </section>

      <section className="card dash-panel">
        <h2>Никнейм</h2>
        <p className="muted">Смена ника стоит {me.nicknameChangeCost} монет. Баланс: {me.coinsBalance} 🪙</p>
        <div className="row">
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={NICKNAME_MAX_LENGTH} />
          <button
            type="button"
            className="btn"
            disabled={busy || nickname.trim().toLowerCase() === me.nickname.toLowerCase() || me.coinsBalance < me.nicknameChangeCost}
            onClick={() => void changeNickname()}
          >
            Сменить за {me.nicknameChangeCost} 🪙
          </button>
        </div>
      </section>

      <section className="card dash-panel">
        <h2>Описание профиля</h2>
        {me.canEditBio ? (
          <p className="muted bio-editor-note">Можно редактировать раз в 24 часа.</p>
        ) : (
          <p className="muted bio-editor-note bio-editor-note--locked">
            Следующее изменение через ~{me.bioEditCooldownHours} ч.
          </p>
        )}
        <div className={`bio-editor${!me.canEditBio ? " bio-editor--disabled" : ""}`}>
          <div className="bio-editor-toolbar">
            <span className="bio-editor-label">О себе</span>
            <span className={`bio-editor-count${bio.length >= 480 ? " bio-editor-count--warn" : ""}`}>
              {bio.length}/500
            </span>
          </div>
          <div className="bio-editor-field">
            <textarea
              className="bio-editor-input"
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажи, во что играешь, какие моды любишь или чем занимаешься на сервере…"
              disabled={!me.canEditBio || busy}
              aria-label="Описание профиля"
            />
          </div>
        </div>
        <button
          type="button"
          className="btn bio-editor-save"
          disabled={busy || !me.canEditBio || bio === (me.bio ?? "")}
          onClick={() => void saveBio()}
        >
          Сохранить описание
        </button>
      </section>
    </div>
  );
}
