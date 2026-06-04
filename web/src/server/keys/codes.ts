import { randomBytes } from "node:crypto";

export const GIFT_KEY_PRICE = Number(process.env.GIFT_KEY_PRICE_COINS ?? 10);

export function makeActivationKeyCode(prefix?: string) {
  const part = randomBytes(3).toString("hex").toUpperCase();
  const part2 = randomBytes(3).toString("hex").toUpperCase();
  const base = `DOP-${part}-${part2}`;
  return prefix ? `${prefix.toUpperCase()}-${base}` : base;
}

/** Маска для UI — без реальных символов ключа */
export function maskGiftKeyCode(code: string) {
  const prefix = code.split("-")[0] ?? "GFT";
  return `${prefix}-████-████`;
}
