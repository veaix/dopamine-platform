import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { verifyAccessToken } from "./tokens";
import { isEmailVerifiedForAuth } from "./email-verification";
import { sessionUserColumns, type SessionDbUser } from "./session-user-columns";

const COOKIE_NAME = "dopamine_access";

export type { SessionDbUser };

export const getCurrentUser = cache(async function getCurrentUser(): Promise<SessionDbUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    const user = await db.query.users.findFirst({
      where: (users, { and }) => and(eq(users.id, payload.sub), eq(users.isBlocked, false)),
      columns: sessionUserColumns,
    });
    if (!user || !isEmailVerifiedForAuth(user)) return null;
    return user;
  } catch {
    return null;
  }
});

export const authCookieName = COOKIE_NAME;
