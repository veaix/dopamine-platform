import { clientIp } from "@/server/admin/client-ip";

export function isTurnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export function isTurnstileRequired() {
  return process.env.NODE_ENV === "production" && isTurnstileConfigured();
}

export async function verifyTurnstileToken(request: Request, token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  if (!token?.trim()) return false;

  const ip = clientIp(request);
  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (ip) body.set("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
  return Boolean(data?.success);
}
