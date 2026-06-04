import { requireAdminApi } from "@/server/admin/guard";
import { getAdminStats } from "@/server/admin/stats";
import { json } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdminApi("stats");
  if (error) return error;

  return json(await getAdminStats());
}
