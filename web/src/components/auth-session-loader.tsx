"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Keeps header balances in sync. When SSR already provided the user, refresh runs
 * after idle so the menu does not wait on another round-trip before paint.
 */
export function AuthSessionLoader({ deferRefresh = false }: { deferRefresh?: boolean }) {
  const { refresh } = useAuth();

  useEffect(() => {
    if (!deferRefresh) {
      void refresh();
      return;
    }

    const run = () => void refresh();
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 400);
    return () => window.clearTimeout(t);
  }, [deferRefresh, refresh]);

  return null;
}
