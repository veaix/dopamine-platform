export type PublicRole = "user" | "admin" | "creator" | string;

const ROLE_LABELS: Record<string, string> = {
  creator: "Создатель",
  admin: "Админ",
  mediagigant: "Медиагигант",
};

export function getPublicRoleBadge(role: string): { label: string; className: string } | null {
  if (!role || role === "user") return null;
  return {
    label: ROLE_LABELS[role] ?? role,
    className: `role-badge role-badge--${role.replace(/[^a-z0-9_-]/gi, "")}`,
  };
}
