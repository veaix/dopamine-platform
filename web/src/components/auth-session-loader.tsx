"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";

/** Hydrates header auth without blocking root layout on DB. */
export function AuthSessionLoader() {
  const { refresh } = useAuth();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return null;
}
