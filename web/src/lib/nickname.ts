export const NICKNAME_MIN_LENGTH = 3;
export const NICKNAME_MAX_LENGTH = 14;
export const NICKNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (trimmed.length < NICKNAME_MIN_LENGTH || trimmed.length > NICKNAME_MAX_LENGTH) {
    return `Ник ${NICKNAME_MIN_LENGTH}–${NICKNAME_MAX_LENGTH} символов`;
  }
  if (!NICKNAME_PATTERN.test(trimmed)) {
    return "Только латиница, цифры и _";
  }
  return null;
}
