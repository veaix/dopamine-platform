"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function RegisterRefCapture() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref")?.trim().toUpperCase();
    if (ref) sessionStorage.setItem("dopamine_ref_promo", ref);
  }, [searchParams]);
  return null;
}
