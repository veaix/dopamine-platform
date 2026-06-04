"use client";

import Link from "next/link";
import type { LeaderboardsData } from "@/server/leaderboards";

type TopCategory = LeaderboardsData["byHours"];

export function TopsClient({ initialData }: { initialData: LeaderboardsData }) {
  return (
    <div className="grid tops">
      <TopList
        title="По часам в лаунчере"
        category={initialData.byHours}
        format={(v) => `${Math.floor(v / 3600)} ч`}
      />
      <TopList title="По лайкам" category={initialData.byLikes} />
      <TopList title="По дизлайкам" category={initialData.byDislikes} />
      <TopList title="По монетам" category={initialData.byCoins} format={(v) => `${v} 🪙`} />
      <TopList title="По доступным слотам серверов" category={initialData.byAvailableServerSlots} />
    </div>
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
