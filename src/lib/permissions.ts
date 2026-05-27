// =============================================================================
// Permissions System — Role-Based Access Control (RBAC) definitions
// =============================================================================

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "UPLOADER";

export type PermissionAction =
  | "manage:admins"      // Create, edit, disable, delete admins, view security logs
  | "manage:settings"    // View and modify global site settings
  | "create:apps"        // Create new apps
  | "edit:apps"          // Edit existing apps, upload screenshots, modify descriptions
  | "delete:apps"        // Delete apps
  | "manage:taxonomies"  // Create, edit, delete categories/tags
  | "manage:versions"    // Create, edit, delete app versions/mirrors
  | "view:dashboard"     // View admin dashboard analytics
  | "view:reports"       // View and manage broken link reports
;

const permissions: Record<AdminRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    "manage:admins",
    "manage:settings",
    "create:apps",
    "edit:apps",
    "delete:apps",
    "manage:taxonomies",
    "manage:versions",
    "view:dashboard",
    "view:reports",
  ],
  ADMIN: [
    "create:apps",
    "edit:apps",
    "delete:apps",
    "manage:taxonomies",
    "manage:versions",
    "view:dashboard",
    "view:reports",
  ],
  EDITOR: [
    "edit:apps",
    "manage:versions",
    "view:dashboard",
  ],
  UPLOADER: [
    "manage:versions",
    "view:dashboard",
  ],
};

/**
 * Checks if a given role has the permission to perform a specific action.
 */
export function hasPermission(role: string | undefined | null, action: PermissionAction): boolean {
  if (!role) return false;
  const rolePermissions = permissions[role as AdminRole];
  if (!rolePermissions) return false;
  return rolePermissions.includes(action);
}

/**
 * Lists all actions mapped to a specific role.
 */
export function getRolePermissions(role: string | undefined | null): PermissionAction[] {
  if (!role) return [];
  return permissions[role as AdminRole] || [];
}
