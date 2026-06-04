"use client";

import { useEffect, useState } from "react";
import { userAvatarSrc } from "@/lib/avatar-url";

type AvatarSize = "sm" | "md" | "lg" | "xl";

type AvatarImgProps = {
  userId: string;
  nickname: string;
  size?: AvatarSize;
  className?: string;
  /** When false, show letter placeholder without requesting the image. */
  hasAvatar?: boolean;
  /** Bust CDN/browser cache after upload (e.g. Date.now()). */
  cacheBust?: number | string;
};

export function AvatarImg({
  userId,
  nickname,
  size = "sm",
  className = "",
  hasAvatar = true,
  cacheBust,
}: AvatarImgProps) {
  const [failed, setFailed] = useState(false);
  const initial = nickname[0]?.toUpperCase() ?? "?";
  const cls = `avatar ${size}${className ? ` ${className}` : ""}`.trim();
  const src = userAvatarSrc(userId, cacheBust);

  useEffect(() => {
    setFailed(false);
  }, [userId, cacheBust, hasAvatar, src]);

  if (!hasAvatar || failed) {
    return <div className={`${cls} placeholder`}>{initial}</div>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt=""
      className={cls}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
