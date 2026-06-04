import { notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getPublicProfile } from "@/server/profile/public";
import { ProfilePublic } from "@/components/profile-public";
import { PageShell } from "@/components/page-shell";

type Props = { params: Promise<{ nickname: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { nickname } = await params;
  const viewer = await getCurrentUser();
  const profile = await getPublicProfile(nickname, viewer);

  if (!profile) notFound();

  return (
    <PageShell className="page-profile" decor="profile">
      <ProfilePublic initialProfile={profile} />
    </PageShell>
  );
}
