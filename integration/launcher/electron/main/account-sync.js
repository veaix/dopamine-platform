/**
 * Copy into minecraft-launcher/electron/main/account-sync.js
 * Register from electron/main/index.js: import { registerAccountIpc } from "./account-sync.js";
 * registerAccountIpc(ipcMain, app, store);
 */
import fs from "node:fs";
import path from "node:path";
import { DopamineAccountClient, canCreateLocalServer } from "@dopamine/account-sdk";

const TOKEN_FILE = "account-device-token.json";
const DEFAULT_API = process.env.DOPAMINE_API_URL || "http://localhost:3000";

function tokenPath(userData) {
  return path.join(userData, TOKEN_FILE);
}

function loadToken(userData) {
  try {
    const raw = fs.readFileSync(tokenPath(userData), "utf8");
    const j = JSON.parse(raw);
    return typeof j.token === "string" ? j.token : null;
  } catch {
    return null;
  }
}

function saveToken(userData, token) {
  fs.mkdirSync(userData, { recursive: true });
  fs.writeFileSync(tokenPath(userData), JSON.stringify({ token }, null, 2), "utf8");
}

function clearToken(userData) {
  try {
    fs.unlinkSync(tokenPath(userData));
  } catch {
    /* ignore */
  }
}

export function registerAccountIpc(ipcMain, app, getRunningServerCount = () => 0) {
  const baseUrl = process.env.DOPAMINE_API_URL || DEFAULT_API;
  const pepper = process.env.DEVICE_TOKEN_PEPPER || "";

  function client() {
    const token = loadToken(app.getPath("userData"));
    return new DopamineAccountClient({ baseUrl, deviceToken: token ?? undefined, deviceTokenPepper: pepper });
  }

  let heartbeatTimer = null;

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(async () => {
      const c = client();
      if (!c) return;
      try {
        await c.heartbeat({
          runningServers: getRunningServerCount(),
          appVersion: app.getVersion(),
          os: process.platform,
        });
      } catch (e) {
        console.warn("[account] heartbeat failed", e?.message || e);
      }
    }, 120_000);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  ipcMain.handle("account:getState", async () => {
    const token = loadToken(app.getPath("userData"));
    if (!token) return { linked: false };
    try {
      const ent = await client().getEntitlements();
      return { linked: true, entitlements: ent };
    } catch {
      return { linked: true, entitlements: null };
    }
  });

  ipcMain.handle("account:link", async (_e, { code, deviceName }) => {
    const c = new DopamineAccountClient({ baseUrl, deviceTokenPepper: pepper });
    const result = await c.linkDevice({
      code,
      deviceName: deviceName || "dopamine",
      appVersion: app.getVersion(),
      os: process.platform,
    });
    saveToken(app.getPath("userData"), result.deviceToken);
    startHeartbeat();
    return result;
  });

  ipcMain.handle("account:logout", async () => {
    stopHeartbeat();
    clearToken(app.getPath("userData"));
    return { ok: true };
  });

  ipcMain.handle("account:redeemKey", async (_e, { code }) => {
    const ent = await client().redeemKey(code);
    return { entitlements: ent };
  });

  ipcMain.handle("account:canCreateServer", async () => {
    const token = loadToken(app.getPath("userData"));
    if (!token) {
      return { allowed: true, reason: "not_linked" };
    }
    try {
      const ent = await client().getEntitlements();
      return {
        allowed: canCreateLocalServer(ent),
        entitlements: ent,
        reason: canCreateLocalServer(ent) ? "ok" : "gated",
      };
    } catch (e) {
      return { allowed: false, reason: "offline", error: String(e?.message || e) };
    }
  });

  if (loadToken(app.getPath("userData"))) startHeartbeat();
}
