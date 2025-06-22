import { Plus, Edit, Check, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import type { RoleWithPermissions, Permission } from "@shared/schema";

export default function Roles() {
  const { data: roles = [] } = useQuery<RoleWithPermissions[]>({
    queryKey: ["/api/roles"],
  });

  const { data: allPermissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "manager":
        return "bg-green-50 border-green-200 text-green-900";
      case "viewer":
        return "bg-gray-50 border-gray-200 text-gray-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "manager":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const hasPermission = (role: RoleWithPermissions, permissionName: string) => {
    return role.permissions.some(p => p.name === permissionName);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>
            <p className="mt-2 text-sm text-gray-600">
              Configure roles and their associated permissions.
            </p>
          </div>
          <PermissionGuard permission="assign_roles">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </PermissionGuard>
        </div>

        {/* Role Cards */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="overflow-hidden">
              <div className={`px-6 py-4 border-b ${getRoleColor(role.name)}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium capitalize">{role.name}</h3>
                  <Badge className={getRoleBadgeColor(role.name)}>
                    3 users
                  </Badge>
                </div>
                <p className="mt-1 text-sm">{role.description}</p>
              </div>
              <CardContent className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
                <div className="space-y-2">
                  {allPermissions.map((permission) => {
                    const hasAccess = hasPermission(role, permission.name);
                    return (
                      <div key={permission.id} className="flex items-center">
                        {hasAccess ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className={`text-sm ${hasAccess ? 'text-gray-700' : 'text-gray-400'}`}>
                          {permission.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-gray-50 border-t">
                <PermissionGuard permission="assign_roles">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit Permissions
                  </Button>
                </PermissionGuard>
              </div>
            </Card>
          ))}
        </div>

        {/* Permission Matrix */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Overview of all permissions across roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permission
                      </th>
                      {roles.map((role) => (
                        <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {role.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allPermissions.map((permission) => (
                      <tr key={permission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {permission.name}
                        </td>
                        {roles.map((role) => (
                          <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                            {hasPermission(role, permission.name) ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
