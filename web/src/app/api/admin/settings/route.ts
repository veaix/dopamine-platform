import { z } from "zod";
import { json, withSchema } from "@/lib/api";
import { requireCreator } from "@/lib/admin";
import { getAppSetting, setAppSetting } from "@/lib/entitlements";
import { writeAudit } from "@/lib/audit";

const patchSchema = z.object({
  serversGated: z.boolean().optional(),
});

export const GET = withSchema(async () => {
  const auth = await requireCreator();
  if (!auth.ok) return auth.response;
  return json({
    serversGated: (await getAppSetting("servers_gated", "true")) === "true",
  });
});

export const PATCH = withSchema(async (req) => {
  const auth = await requireCreator();
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const body = patchSchema.parse(await req.json());
  if (body.serversGated !== undefined) {
    await setAppSetting("servers_gated", body.serversGated ? "true" : "false");
    await writeAudit("admin.settings", user.id, { serversGated: body.serversGated });
  }
  return json({
    serversGated: (await getAppSetting("servers_gated", "true")) === "true",
  });
});
