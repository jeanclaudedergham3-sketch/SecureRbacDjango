import { useAuth } from "./use-auth";

export function usePermissions() {
  const { permissions } = useAuth();

  const isAdmin = permissions.includes("system.admin");

  const hasPermission = (permission: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (isAdmin) return true;
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (isAdmin) return true;
    return permissionList.every(permission => permissions.includes(permission));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
