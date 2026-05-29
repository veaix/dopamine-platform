import { nanoid } from "nanoid";
import { z } from "zod";
import { err, json, withSchema } from "@/lib/api";
import { requireCreator } from "@/lib/admin";
import { formatActivationKey, generateToken, hashActivationKey } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { activationKeys } from "@/db/schema";
import type { Grants } from "@/lib/entitlements";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  label: z.string().max(120).optional(),
  canCreateServers: z.boolean().default(true),
  maxServers: z.number().int().min(0).max(999).default(3),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
  maxUses: z.number().int().min(1).max(10000).default(1),
  expiresAt: z.string().datetime().optional(),
});

export const POST = withSchema(async (req) => {
  const auth = await requireCreator();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const body = bodySchema.parse(await req.json());
  const raw = `DOP${generateToken(6).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12)}`;
  const display = formatActivationKey(raw);
  const grants: Grants = {
    canCreateServers: body.canCreateServers,
    maxServers: body.maxServers,
    expiresInDays: body.expiresInDays,
  };

  const db = getDb();
  await db.insert(activationKeys).values({
    id: nanoid(),
    codeHash: hashActivationKey(display),
    label: body.label ?? null,
    grantsJson: JSON.stringify(grants),
    maxUses: body.maxUses,
    usesLeft: body.maxUses,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    createdBy: user.id,
  });

  await writeAudit("admin.key.generate", user.id, { label: body.label });
  return json({ ok: true, code: display, grants });
});
