import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminClient } from "@/components/admin-client";
import { ensureSchema } from "@/lib/db";
import { getAppSetting } from "@/lib/entitlements";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "creator") redirect("/dashboard");

  await ensureSchema();
  const serversGated = (await getAppSetting("servers_gated", "true")) === "true";

  return <AdminClient initialServersGated={serversGated} />;
}
