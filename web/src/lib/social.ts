export type SocialLinks = {
  discord?: string;
  telegram?: string;
  youtube?: string;
  twitch?: string;
  vk?: string;
};

export function parseSocialLinks(raw: string | null | undefined): SocialLinks {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SocialLinks;
  } catch {
    return {};
  }
}

export function serializeSocialLinks(links: SocialLinks) {
  return JSON.stringify(links);
}
