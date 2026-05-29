import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { auditLog } from "@/db/schema";

export async function writeAudit(action: string, actorUserId?: string, meta?: Record<string, unknown>) {
  const db = getDb();
  await db.insert(auditLog).values({
    id: nanoid(),
    actorUserId: actorUserId ?? null,
    action,
    metaJson: meta ? JSON.stringify(meta) : null,
  });
}
