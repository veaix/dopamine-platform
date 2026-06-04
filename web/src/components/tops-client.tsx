"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LeaderboardsData } from "@/server/leaderboards";
import { EMPTY_LEADERBOARDS } from "@/server/leaderboards/empty";

type TopCategory = LeaderboardsData["byHours"];

export function TopsClient() {
  const [data, setData] = useState<LeaderboardsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 25_000);

    void fetch("/api/leaderboards", { credentials: "same-origin", signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<LeaderboardsData>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error && e.name === "AbortError" ? "timeout" : "load_failed");
          setData(EMPTY_LEADERBOARDS);
        }
      })
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, []);

  if (!data) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <p className="muted">Загрузка топов…</p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p className="muted" style={{ marginBottom: "1rem" }}>
          Не удалось загрузить актуальные данные. Показан пустой список — попробуйте обновить страницу.
        </p>
      ) : null}
      <div className="grid tops">
        <TopList
          title="По часам в лаунчере"
          category={data.byHours}
          format={(v) => `${Math.floor(v / 3600)} ч`}
        />
        <TopList title="По лайкам" category={data.byLikes} />
        <TopList title="По дизлайкам" category={data.byDislikes} />
        <TopList title="По монетам" category={data.byCoins} format={(v) => `${v} 🪙`} />
        <TopList title="По доступным слотам серверов" category={data.byAvailableServerSlots} />
      </div>
    </>
  );
}

function TopList({
  title,
  category,
  format = (v) => String(v),
}: {
  title: string;
  category: TopCategory;
  format?: (v: number) => string;
}) {
  const { top, me } = category;

  return (
    <section className="card top-column">
      <h2>{title}</h2>
      <ol className="top-list">
        {top.length === 0 ? (
          <li className="muted">Пока пусто</li>
        ) : (
          top.map((r, i) => (
            <li key={r.nickname}>
              <span className="rank">{i + 1}</span>
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.avatarUrl} alt="" className="avatar sm" />
              ) : (
                <div className="avatar sm placeholder">{r.nickname[0]?.toUpperCase()}</div>
              )}
              <Link href={`/u/${r.nickname}`}>{r.nickname}</Link>
              <span className="value">{format(Number(r.value))}</span>
            </li>
          ))
        )}
      </ol>
      {me ? (
        <div className="top-me">
          <p className="top-me-label">Ваше место</p>
          <div className="top-me-row">
            <span className="rank">{me.rank}</span>
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.avatarUrl} alt="" className="avatar sm" />
            ) : (
              <div className="avatar sm placeholder">{me.nickname[0]?.toUpperCase()}</div>
            )}
            <Link href={`/u/${me.nickname}`}>{me.nickname}</Link>
            <span className="value">{format(Number(me.value))}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
