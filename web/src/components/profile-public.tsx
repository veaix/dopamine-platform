"use client";



import Link from "next/link";

import { useEffect, useState } from "react";
import type { ProfileViewerEntry } from "@/server/profile/views";

import type { PublicProfile } from "@/server/profile/public";
import { BrokenHeartIcon, HeartIcon } from "@/components/reaction-icons";
import { getPublicRoleBadge } from "@/lib/role-labels";
import { AvatarImg } from "@/components/avatar-img";

function applyReactionToggle(
  prev: PublicProfile,
  reaction: "like" | "dislike",
): PublicProfile {
  const was = prev.myReaction;
  let likes = prev.likes;
  let dislikes = prev.dislikes;

  if (was === reaction) {
    if (reaction === "like") likes = Math.max(0, likes - 1);
    else dislikes = Math.max(0, dislikes - 1);
    return { ...prev, likes, dislikes, myReaction: null };
  }

  if (was === "like") likes = Math.max(0, likes - 1);
  if (was === "dislike") dislikes = Math.max(0, dislikes - 1);
  if (reaction === "like") likes += 1;
  else dislikes += 1;

  return { ...prev, likes, dislikes, myReaction: reaction };
}

export function ProfilePublic({
  initialProfile,
  loadViewersLazy = false,
}: {
  initialProfile: PublicProfile;
  loadViewersLazy?: boolean;
}) {
  const [p, setP] = useState(initialProfile);
  const [viewersLoading, setViewersLoading] = useState(loadViewersLazy);
  const [reacting, setReacting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loadViewersLazy) return;
    let cancelled = false;
    void fetch(`/api/profiles/${encodeURIComponent(p.nickname)}/viewers`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d: { viewers?: ProfileViewerEntry[]; error?: string }) => {
        if (cancelled) return;
        if (d.viewers) setP((prev) => ({ ...prev, recentViewers: d.viewers! }));
      })
      .finally(() => {
        if (!cancelled) setViewersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadViewersLazy, p.nickname]);



  const load = () =>

    void fetch(`/api/profiles/${encodeURIComponent(p.nickname)}`)

      .then((r) => r.json())

      .then((d) => {
        if (d.error) setErr(d.error);
        else if (d.profile) {
          setP((prev) => ({
            ...d.profile,
            recentViewers: d.profile.recentViewers?.length ? d.profile.recentViewers : prev.recentViewers,
          }));
        }
      });



  if (err) return <p className="error">{err}</p>;



  const hours = Math.floor(p.playtimeSeconds / 3600);
  const roleBadge = getPublicRoleBadge(p.role);

  return (

    <div className="card stack">

      <div className="profile-head">

        <AvatarImg
          userId={p.targetUserId}
          nickname={p.nickname}
          size="lg"
          hasAvatar={p.hasAvatar}
          avatarVersion={p.avatarVersion}
        />

        <div>
          <div className="profile-name-row">
            <h1>{p.nickname}</h1>
            {roleBadge ? (
              <span className={roleBadge.className} title={roleBadge.label}>
                {roleBadge.label}
              </span>
            ) : null}
          </div>
          <p className={`profile-bio${p.bio ? "" : " profile-bio--empty"}`}>{p.bio || "Без описания"}</p>
        </div>

      </div>

      <div className="grid stats">

        <div className="stat">

          <span>Часы</span>

          <strong>{hours}</strong>

        </div>

        <div className="stat">
          <span className="stat-label">
            <HeartIcon className="stat-icon" />
            Лайки
          </span>
          <strong>{p.likes}</strong>
        </div>

        <div className="stat">
          <span className="stat-label">
            <BrokenHeartIcon className="stat-icon" />
            Дизлайки
          </span>
          <strong>{p.dislikes}</strong>
        </div>

      </div>

      <div className="social">

        {Object.entries(p.social).map(([k, v]) =>

          v ? (

            <a key={k} href={v.startsWith("http") ? v : `https://${v}`} target="_blank" rel="noreferrer">

              {k}

            </a>

          ) : null,

        )}

      </div>

      {p.relation.status !== "self" ? (

        <div className="row profile-reactions">
          <button
            type="button"
            className={`profile-reaction-btn profile-reaction-btn--like${p.myReaction === "like" ? " active" : ""}`}
            disabled={reacting}
            onClick={() => void react("like")}
            aria-pressed={p.myReaction === "like"}
            aria-label={p.myReaction === "like" ? "Убрать лайк" : "Лайк"}
            title={p.myReaction === "like" ? "Убрать лайк" : "Лайк"}
          >
            <HeartIcon filled={p.myReaction === "like"} />
          </button>

          <button
            type="button"
            className={`profile-reaction-btn profile-reaction-btn--dislike${p.myReaction === "dislike" ? " active" : ""}`}
            disabled={reacting}
            onClick={() => void react("dislike")}
            aria-pressed={p.myReaction === "dislike"}
            aria-label={p.myReaction === "dislike" ? "Убрать дизлайк" : "Дизлайк"}
            title={p.myReaction === "dislike" ? "Убрать дизлайк" : "Дизлайк"}
          >
            <BrokenHeartIcon filled={p.myReaction === "dislike"} />
          </button>

          {p.relation.status === "none" ? (

            <button

              type="button"

              className="btn ghost"

              onClick={() =>

                void fetch("/api/friends/request", {

                  method: "POST",

                  headers: { "Content-Type": "application/json" },

                  body: JSON.stringify({ nickname: p.nickname }),

                }).then(() => load())

              }

            >

              В друзья

            </button>

          ) : null}

          {p.relation.status === "incoming" && p.relation.requestId ? (

            <button

              type="button"

              className="btn"

              onClick={() =>

                void fetch("/api/friends/respond", {

                  method: "POST",

                  headers: { "Content-Type": "application/json" },

                  body: JSON.stringify({ requestId: p.relation.requestId, action: "accept" }),

                }).then(() => load())

              }

            >

              Принять заявку

            </button>

          ) : null}

        </div>

      ) : null}



      {loadViewersLazy || p.recentViewers.length > 0 ? (

        <section className="profile-viewers stack sm">

          <h2 className="profile-viewers-title">Недавние просмотры</h2>

          {viewersLoading ? (
            <p className="muted">Загрузка…</p>
          ) : p.recentViewers.length === 0 ? (

            <p className="muted">

              {p.relation.status === "self"

                ? "Пока никто не смотрел ваш профиль"

                : "Пока никто не смотрел этот профиль"}

            </p>

          ) : (

            <ul className="profile-viewer-list">

              {p.recentViewers.map((v) => (

                <li key={`${v.nickname}-${v.viewedAt}`} className="profile-viewer-item">

                  <Link href={`/u/${v.nickname}`} className="profile-viewer-row">
                    <AvatarImg userId={v.userId} nickname={v.nickname} size="sm" />
                    <span className="profile-viewer-name">{v.nickname}</span>
                  </Link>

                  <div className="profile-viewer-meta">

                    {v.reaction === "like" ? (
                      <span className="profile-reaction-icon like" title="Лайк">
                        <HeartIcon filled />
                      </span>
                    ) : null}

                    {v.reaction === "dislike" ? (
                      <span className="profile-reaction-icon dislike" title="Дизлайк">
                        <BrokenHeartIcon filled />
                      </span>
                    ) : null}

                    <time className="muted" dateTime={v.viewedAt}>

                      {formatViewedAt(v.viewedAt)}

                    </time>

                  </div>

                </li>

              ))}

            </ul>

          )}

        </section>

      ) : null}

    </div>

  );



  function formatViewedAt(iso: string) {

    const d = new Date(iso);

    const diff = Date.now() - d.getTime();

    const mins = Math.floor(diff / 60_000);

    if (mins < 1) return "только что";

    if (mins < 60) return `${mins} мин. назад`;

    const hoursAgo = Math.floor(mins / 60);

    if (hoursAgo < 24) return `${hoursAgo} ч. назад`;

    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  }



  async function react(reaction: "like" | "dislike") {
    if (reacting) return;
    setErr("");
    const snapshot = p;
    setP((prev) => applyReactionToggle(prev, reaction));
    setReacting(true);

    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(p.nickname)}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reaction }),
      });
      const data = (await res.json()) as {
        error?: string;
        likes?: number;
        dislikes?: number;
        myReaction?: "like" | "dislike" | null;
      };

      if (!res.ok) {
        setP(snapshot);
        setErr(data.error ?? "Не удалось обновить реакцию");
        return;
      }

      if (typeof data.likes === "number" && typeof data.dislikes === "number") {
        setP((prev) => ({
          ...prev,
          likes: data.likes!,
          dislikes: data.dislikes!,
          myReaction: data.myReaction ?? null,
        }));
      }
    } catch {
      setP(snapshot);
      setErr("Сеть недоступна");
    } finally {
      setReacting(false);
    }
  }

}

