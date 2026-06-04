"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LeaderboardsData } from "@/server/leaderboards";
import { mergeMeRanks } from "@/lib/leaderboards-merge";

type TopCategory = LeaderboardsData["byHours"];

export function TopsClient({
  initialData,
  loadMeRanks = false,
}: {
  initialData: LeaderboardsData;
  loadMeRanks?: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [meLoading, setMeLoading] = useState(loadMeRanks);

  useEffect(() => {
    if (!loadMeRanks) return;

    let cancelled = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 10_000);

    void fetch("/api/leaderboards/me", { credentials: "same-origin", signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{
          nickname: string;
          me: {
            byHours: LeaderboardsData["byHours"]["me"];
            byLikes: LeaderboardsData["byLikes"]["me"];
            byDislikes: LeaderboardsData["byDislikes"]["me"];
            byAvailableServerSlots: LeaderboardsData["byAvailableServerSlots"]["me"];
            byCoins: LeaderboardsData["byCoins"]["me"];
          } | null;
        }>;
      })
      .then((json) => {
        if (cancelled || !json?.me) return;
        const ranks = json.me;
        setData((prev) => mergeMeRanks(prev, ranks, json.nickname));
      })
      .finally(() => {
        if (!cancelled) setMeLoading(false);
        window.clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [loadMeRanks]);

  return (
    <>
      {meLoading ? (
        <p className="muted" style={{ marginBottom: "1rem" }}>
          Загружаем ваши места в рейтинге…
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
              <div className="avatar sm placeholder">{r.nickname[0]?.toUpperCase()}</div>
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
            <div className="avatar sm placeholder">{me.nickname[0]?.toUpperCase()}</div>
            <Link href={`/u/${me.nickname}`}>{me.nickname}</Link>
            <span className="value">{format(Number(me.value))}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
