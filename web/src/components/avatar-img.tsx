"use client";

import { useState } from "react";
import { userAvatarSrc } from "@/lib/avatar-url";

type AvatarSize = "sm" | "md" | "lg" | "xl";

type AvatarImgProps = {
  userId: string;
  nickname: string;
  size?: AvatarSize;
  className?: string;
  /** Bust CDN/browser cache after upload (e.g. Date.now()). */
  cacheBust?: number | string;
};

export function AvatarImg({
  userId,
  nickname,
  size = "sm",
  className = "",
  cacheBust,
}: AvatarImgProps) {
  const [failed, setFailed] = useState(false);
  const initial = nickname[0]?.toUpperCase() ?? "?";
  const cls = `avatar ${size}${className ? ` ${className}` : ""}`.trim();

  if (failed) {
    return <div className={`${cls} placeholder`}>{initial}</div>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={userAvatarSrc(userId, cacheBust)}
      alt=""
      className={cls}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
