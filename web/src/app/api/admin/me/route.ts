import { desc } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { permissionsPayload } from "@/lib/admin-permissions";
import { json } from "@/lib/api";

export async function GET() {
  const { admin, error } = await requireAdminApi();
  if (error) return error;
  return json({ ...permissionsPayload(admin!) });
}
