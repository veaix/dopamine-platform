import Link from "next/link";
import type { DashboardUser } from "@/server/dashboard/profile";
import { AvatarImg } from "@/components/avatar-img";
import { formatEconomyDisplay } from "@/lib/creator-display";

export function ProfileHeader({ me }: { me: DashboardUser }) {
  const hours = Math.floor(me.playtimeSeconds / 3600);

  return (
    <section className="card dash-profile">
      <div className="dash-profile-main">
        <AvatarImg
          userId={me.id}
          nickname={me.nickname}
          size="xl"
          hasAvatar={me.hasAvatar}
          avatarVersion={me.avatarVersion}
        />
        <div className="dash-profile-info">
          <h1 className="dash-nickname">{me.nickname}</h1>
          <p className="muted dash-email">{me.email}</p>
          <Link href={`/u/${me.nickname}`} className="dash-profile-link">
            Публичный профиль →
          </Link>
        </div>
      </div>
      <div className="dash-stats">
        <div className="dash-stat">
          <span>Монеты</span>
          <strong>{formatEconomyDisplay(me.coinsBalance, Boolean(me.creatorUnlimited))}</strong>
        </div>
        <div className="dash-stat">
          <span>Слоты серверов</span>
          <strong>{formatEconomyDisplay(me.availableServerSlots, Boolean(me.creatorUnlimited))}</strong>
        </div>
        <div className="dash-stat">
          <span>Часы в лаунчере</span>
          <strong>{hours}</strong>
        </div>
        <div className="dash-stat">
          <span>Лайки / дизлайки</span>
          <strong>
            {me.likes} / {me.dislikes}
          </strong>
        </div>
      </div>
    </section>
  );
}
