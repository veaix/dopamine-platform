import type { AdminPermission } from "@/lib/admin-permissions";
import { permissionsPayload } from "@/lib/admin-permissions";
import type { SessionDbUser } from "@/server/auth/session";

export type AdminShellProps = {
  permissions: AdminPermission[];
  isCreator: boolean;
  role: string;
};

export function getAdminShell(user: SessionDbUser): AdminShellProps {
  const payload = permissionsPayload(user);
  return {
    permissions: payload.permissions,
    isCreator: payload.isCreator,
    role: payload.role,
  };
}
