import { json, withSchema } from "@/lib/api";
import { getPublicStats } from "@/lib/entitlements";

export const GET = withSchema(async () => {
  const stats = await getPublicStats();
  return json(stats);
});
