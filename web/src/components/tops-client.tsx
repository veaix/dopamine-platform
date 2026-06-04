"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { FastLeaderboards, LeaderboardsData, SlowLeaderboards } from "@/server/leaderboards";
import { mergeMeRanks } from "@/lib/leaderboards-merge";
import {
  LEADERBOARD_FAST_POLL_MS,
  LEADERBOARD_SLOW_POLL_MS,
} from "@/lib/leaderboards-poll";

type TopCategory = LeaderboardsData["byHours"];

type MeFastPayload = {
  nickname: string;
  me: {
    byLikes: TopCategory["me"];
    byDislikes: TopCategory["me"];
    byAvailableServerSlots: TopCategory["me"];
    byCoins: TopCategory["me"];
  } | null;
};

type MeSlowPayload = {
  nickname: string;
  me: { byHours: TopCategory["me"] } | null;
};

export function TopsClient({
  initialData,
  loadMeRanks = false,
}: {
  initialData: LeaderboardsData;
  loadMeRanks?: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [meLoading, setMeLoading] = useState(loadMeRanks);

  const applyFast = useCallback((fast: FastLeaderboards) => {
    setData((prev) => ({
      ...prev,
      ...fast,
    }));
  }, []);

  const applySlow = useCallback((slow: SlowLeaderboards) => {
    setData((prev) => ({
      ...prev,
      ...slow,
    }));
  }, []);

  const applyMeFast = useCallback((payload: MeFastPayload) => {
    if (!payload.me) return;
    setData((prev) =>
      mergeMeRanks(
        prev,
        {
          byHours: null,
          byLikes: payload.me!.byLikes,
          byDislikes: payload.me!.byDislikes,
          byAvailableServerSlots: payload.me!.byAvailableServerSlots,
          byCoins: payload.me!.byCoins,
        },
        payload.nickname,
      ),
    );
  }, []);

  const applyMeSlow = useCallback((payload: MeSlowPayload) => {
    if (!payload.me?.byHours) return;
    setData((prev) =>
      mergeMeRanks(
        prev,
        {
          byHours: payload.me!.byHours,
          byLikes: null,
          byDislikes: null,
          byAvailableServerSlots: null,
          byCoins: null,
        },
        payload.nickname,
      ),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function pollFast() {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        const [fastRes, meRes] = await Promise.all([
          fetch("/api/leaderboards/fast", { credentials: "same-origin" }),
          loadMeRanks
            ? fetch("/api/leaderboards/me/fast", { credentials: "same-origin" })
            : Promise.resolve(null),
        ]);
        if (fastRes.ok) {
          const fast = (await fastRes.json()) as FastLeaderboards;
          if (!cancelled) applyFast(fast);
        }
        if (meRes?.ok) {
          const meJson = (await meRes.json()) as MeFastPayload;
          if (!cancelled) {
            applyMeFast(meJson);
            setMeLoading(false);
          }
        }
      } catch {
        /* ignore */
      }
    }

    void pollFast();
    const fastTimer = window.setInterval(() => void pollFast(), LEADERBOARD_FAST_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(fastTimer);
    };
  }, [loadMeRanks, applyFast, applyMeFast]);

  useEffect(() => {
    let cancelled = false;

    async function pollSlow() {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        const [slowRes, meRes] = await Promise.all([
          fetch("/api/leaderboards/slow", { credentials: "same-origin" }),
          loadMeRanks
            ? fetch("/api/leaderboards/me/slow", { credentials: "same-origin" })
            : Promise.resolve(null),
        ]);
        if (slowRes.ok) {
          const slow = (await slowRes.json()) as SlowLeaderboards;
          if (!cancelled) applySlow(slow);
        }
        if (meRes?.ok) {
          const meJson = (await meRes.json()) as MeSlowPayload;
          if (!cancelled) applyMeSlow(meJson);
        }
      } catch {
        /* ignore */
      }
    }

    const slowTimer = window.setInterval(() => void pollSlow(), LEADERBOARD_SLOW_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(slowTimer);
    };
  }, [loadMeRanks, applySlow, applyMeSlow]);

  useEffect(() => {
    if (!loadMeRanks) return;

    let cancelled = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 10_000);

    void Promise.all([
      fetch("/api/leaderboards/me/fast", { credentials: "same-origin", signal: ctrl.signal }),
      fetch("/api/leaderboards/me/slow", { credentials: "same-origin", signal: ctrl.signal }),
    ])
      .then(async ([fastRes, slowRes]) => {
        if (cancelled) return;
        if (fastRes.ok) applyMeFast((await fastRes.json()) as MeFastPayload);
        if (slowRes.ok) applyMeSlow((await slowRes.json()) as MeSlowPayload);
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
  }, [loadMeRanks, applyMeFast, applyMeSlow]);

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
