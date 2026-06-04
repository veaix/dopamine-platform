export type SiteSocialLink = {
  id: string;
  label: string;
  href: string;
  color: string;
};

/** Официальные соцсети dopamine (те же, что в лаунчере). */
export const SITE_SOCIAL_LINKS: SiteSocialLink[] = [
  {
    id: "discord",
    label: "Discord",
    href: "https://discord.gg/65pP3jDCYs",
    color: "#5865F2",
  },
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/dopamineall",
    color: "#2AABEE",
  },
];
