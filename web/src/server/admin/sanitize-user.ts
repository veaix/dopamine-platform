import type { users } from "@/server/db/schema";

type UserRow = typeof users.$inferSelect;

export function sanitizeAdminUser(user: UserRow) {
  const {
    passwordHash: _ph,
    totpSecret: _ts,
    ...safe
  } = user;
  return safe;
}
