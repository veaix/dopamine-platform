/** Max playtime seconds accepted per heartbeat request. */
export const LAUNCHER_HEARTBEAT_MAX_SECONDS = 90;

/** Max heartbeat requests per user per window. */
export const LAUNCHER_HEARTBEAT_LIMIT = 2;

export const LAUNCHER_HEARTBEAT_WINDOW_MS = 60_000;

/** Device bearer token lifetime (launcher). */
export const DEVICE_TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export const LAUNCHER_DEVICE_LABEL = "dopamine launcher";

export const MAX_DEVICES_PER_USER = 12;
