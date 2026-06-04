import type { users } from "@/server/db/schema";

type UserRow = typeof users.$inferSelect;

export function isAdmin(user: Pick<UserRow, "role">) {
  return user.role === "creator" || user.role === "admin";
}
