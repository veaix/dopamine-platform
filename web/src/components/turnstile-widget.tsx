"use client";

import { Turnstile } from "@marsidev/react-turnstile";

export function TurnstileWidget({
  onToken,
  onExpire,
}: {
  onToken: (token: string) => void;
  onExpire: () => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) return null;

  return (
    <div className="turnstile-wrap">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onToken}
        onExpire={onExpire}
        options={{ theme: "dark", size: "flexible" }}
      />
    </div>
  );
}

export function isTurnstileEnabledClient() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}
