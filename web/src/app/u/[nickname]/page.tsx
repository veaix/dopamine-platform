import { notFound } from "next/navigation";
import { after } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getPublicProfileCore, recordProfileViewForNickname } from "@/server/profile/public";
import { ProfilePublic } from "@/components/profile-public";
import { PageShell } from "@/components/page-shell";

type Props = { params: Promise<{ nickname: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { nickname } = await params;
  const viewer = await getCurrentUser();
  const profile = await getPublicProfileCore(nickname, viewer);

  if (!profile) notFound();

  if (viewer && viewer.id !== profile.targetUserId) {
    after(() => recordProfileViewForNickname(nickname, viewer.id));
  }

  return (
    <PageShell className="page-profile" decor="profile">
      <ProfilePublic initialProfile={{ ...profile, recentViewers: [] }} loadViewersLazy />
    </PageShell>
  );
}
