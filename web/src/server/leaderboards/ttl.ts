/** Playtime — обновляется редко (минуты). */
export const LEADERBOARD_SLOW_REVALIDATE_SEC = 300;

/** Лайки, дизлайки, монеты, слоты — почти в реальном времени. */
export const LEADERBOARD_FAST_REVALIDATE_SEC = 4;

/** Клиентский опрос быстрых топов (мс). */
export const LEADERBOARD_FAST_POLL_MS = 4_000;

/** Клиентский опрос медленных топов (мс) — 5 мин. */
export const LEADERBOARD_SLOW_POLL_MS = 300_000;
