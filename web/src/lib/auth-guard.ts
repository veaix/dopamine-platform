import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { isAdmin } from "@/lib/admin";

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const q = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/login${q}`);
  }
  return user;
}

export async function requireGuest() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!isAdmin(user)) redirect("/dashboard");
  return user;
}
