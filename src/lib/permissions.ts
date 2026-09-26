import type { Role } from "@/lib/types";

export const PERMISSIONS = {
  viewDashboard: ["admin", "technician", "viewer"],
  viewRecords: ["admin", "technician", "viewer"],
  manageMachines: ["admin"],
  editAlarms: ["admin", "technician"],
  editMaintenance: ["admin", "technician"],
  manageUsers: ["admin"],
  viewAuditLog: ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
