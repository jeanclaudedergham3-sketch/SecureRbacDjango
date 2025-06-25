import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

interface AdvancedPermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  hideOnNoPermission?: boolean;
  renderWhenHidden?: ReactNode;
}

export function AdvancedPermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  hideOnNoPermission = false,
  renderWhenHidden
}: AdvancedPermissionGuardProps) {
  const { user, permissions: userPermissions } = useAuth();
  
  if (!user) {
    if (hideOnNoPermission) {
      return renderWhenHidden ? <>{renderWhenHidden}</> : null;
    }
    return fallback ? <>{fallback}</> : null;
  }

  const permissionsToCheck = permission ? [permission] : permissions;

  if (permissionsToCheck.length === 0) {
    return <>{children}</>;
  }

  const hasPermission = requireAll
    ? permissionsToCheck.every(perm => userPermissions.includes(perm))
    : permissionsToCheck.some(perm => userPermissions.includes(perm));

  // Admin override - system.admin permission grants access to everything
  const isSystemAdmin = userPermissions.includes('system.admin');

  if (!hasPermission && !isSystemAdmin) {
    if (hideOnNoPermission) {
      return renderWhenHidden ? <>{renderWhenHidden}</> : null;
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Hook for checking permissions in components
export function useAdvancedPermissions() {
  const { user, permissions } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!user || !permissions) return false;
    
    // Admin override
    if (permissions.includes('system.admin')) return true;
    
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!user || !permissions) return false;
    
    // Admin override
    if (permissions.includes('system.admin')) return true;
    
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!user || !permissions) return false;
    
    // Admin override
    if (permissions.includes('system.admin')) return true;
    
    return permissionList.every(permission => permissions.includes(permission));
  };

  const isSystemAdmin = (): boolean => {
    return permissions?.includes('system.admin') || false;
  };

  const getUserRole = (): string => {
    return user?.role || 'guest';
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSystemAdmin,
    getUserRole,
    userPermissions: permissions || []
  };
}

// Component for conditional rendering based on role
interface RoleGuardProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
  hideOnNoRole?: boolean;
}

export function RoleGuard({ children, roles, fallback, hideOnNoRole = false }: RoleGuardProps) {
  const { user, role } = useAuth();
  
  if (!user || !roles.includes(role || '')) {
    if (hideOnNoRole) return null;
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Higher-order component for permission-based page access
export function withPermissionGuard(
  Component: React.ComponentType,
  requiredPermissions: string[],
  requireAll: boolean = false
) {
  return function PermissionGuardedComponent(props: any) {
    const { hasAnyPermission, hasAllPermissions } = useAdvancedPermissions();
    
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}