import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { sendPlainEmail } from "@/server/mail";
import { json, err } from "@/lib/api";

type Filter = "all" | "verified" | "unverified" | "blocked";

export async function POST(request: Request) {
  const { admin, error } = await requireAdminApi("email");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    subject?: string;
    text?: string;
    filter?: Filter;
  } | null;

  const subject = body?.subject?.trim();
  const text = body?.text?.trim();
  const filter = body?.filter ?? "verified";

  if (!subject || !text) return err("Укажите тему и текст", 400);
  if (subject.length > 200 || text.length > 10_000) return err("Слишком длинное сообщение", 400);

  let users: { id: string; email: string }[] = [];

  if (filter === "verified") {
    users = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(and(isNotNull(schema.users.emailVerifiedAt), eq(schema.users.isBlocked, false)));
  } else if (filter === "unverified") {
    users = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(isNull(schema.users.emailVerifiedAt));
  } else if (filter === "blocked") {
    users = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.isBlocked, true));
  } else {
    users = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.isBlocked, false));
  }

  let sent = 0;
  let failed = 0;
  for (const u of users) {
    try {
      await sendPlainEmail({ to: u.email, subject, text });
      sent++;
    } catch {
      failed++;
    }
  }

  await logAdminAction({
    admin: admin!,
    action: "email.broadcast",
    targetType: "broadcast",
    details: { filter, subject, sent, failed, total: users.length },
    request,
  });

  return json({ ok: true, sent, failed, total: users.length });
}
