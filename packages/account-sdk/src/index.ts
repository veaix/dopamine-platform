import { createHmac } from "node:crypto";

export type Entitlements = {
  canCreateServers: boolean;
  maxServers: number;
  serversGated: boolean;
  role: "user" | "tester" | "creator";
  expiresAt: string | null;
  source: string;
};

export type DopamineAccountClientOptions = {
  baseUrl: string;
  deviceToken?: string;
  deviceTokenPepper?: string;
};

export class DopamineAccountClient {
  private baseUrl: string;
  private deviceToken: string | null;
  private pepper: string;

  constructor(opts: DopamineAccountClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.deviceToken = opts.deviceToken ?? null;
    this.pepper = opts.deviceTokenPepper ?? "";
  }

  setDeviceToken(token: string | null) {
    this.deviceToken = token;
  }

  private headers(json = true): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) h["content-type"] = "application/json";
    if (this.deviceToken) {
      h.authorization = `Bearer ${this.deviceToken}`;
      h["x-device-token"] = this.deviceToken;
    }
    return h;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, init);
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      const err = new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      (err as Error & { status: number }).status = res.status;
      throw err;
    }
    return data;
  }

  async linkDevice(payload: {
    code: string;
    deviceName?: string;
    appVersion?: string;
    os?: string;
  }): Promise<{
    deviceToken: string;
    entitlements: Entitlements;
    user: { email: string; role: string };
  }> {
    const data = await this.request<{
      deviceToken: string;
      entitlements: Entitlements;
      user: { email: string; role: string };
    }>("/api/devices/link", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        code: payload.code,
        deviceName: payload.deviceName ?? "dopamine",
        appVersion: payload.appVersion,
        os: payload.os,
      }),
    });
    this.deviceToken = data.deviceToken;
    return data;
  }

  async getEntitlements(): Promise<Entitlements> {
    const data = await this.request<{ entitlements: Entitlements }>("/api/me/entitlements", {
      headers: this.headers(false),
    });
    return data.entitlements;
  }

  async redeemKey(code: string): Promise<Entitlements> {
    const data = await this.request<{ entitlements: Entitlements }>("/api/keys/redeem", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ code }),
    });
    return data.entitlements;
  }

  async heartbeat(payload: {
    runningServers: number;
    appVersion?: string;
    os?: string;
  }): Promise<Entitlements> {
    const body = JSON.stringify({
      runningServers: payload.runningServers,
      appVersion: payload.appVersion,
      os: payload.os,
      ts: Math.floor(Date.now() / 1000),
    });
    const sig =
      this.deviceToken && this.pepper
        ? createHmac("sha256", this.pepper).update(`${this.deviceToken}:${body}`).digest("hex")
        : undefined;

    const headers = this.headers();
    if (sig) headers["x-heartbeat-sig"] = sig;

    const data = await this.request<{ entitlements: Entitlements }>("/api/heartbeat", {
      method: "POST",
      headers,
      body,
    });
    return data.entitlements;
  }

  async getPublicStats(): Promise<{
    registeredUsers: number;
    linkedDevices: number;
    onlineDevices: number;
    runningServersNow: number;
    serversGated: boolean;
  }> {
    return this.request("/api/stats/public", { headers: this.headers(false) });
  }
}

export function canCreateLocalServer(ent: Entitlements): boolean {
  if (ent.role === "creator") return true;
  if (!ent.serversGated) return true;
  return ent.canCreateServers;
}
