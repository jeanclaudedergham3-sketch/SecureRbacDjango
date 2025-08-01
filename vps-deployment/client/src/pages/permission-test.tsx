import { useState } from "react";
import { Shield, CheckCircle, XCircle, Settings, Users, Wrench } from "lucide-react";
import { AdvancedPermissionGuard, useAdvancedPermissions } from "@/components/rbac/advanced-permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function PermissionTestPage() {
  const { user, permissions } = useAuth();
  const { hasPermission, hasAnyPermission, isSystemAdmin, getUserRole, userPermissions } = useAdvancedPermissions();

  // Sample permission tests across all categories
  const permissionTests = [
    // Dashboard
    { permission: "dashboard.view", category: "Dashboard", description: "View dashboard" },
    { permission: "dashboard.stats", category: "Dashboard", description: "View dashboard statistics" },
    
    // User Management
    { permission: "users.view", category: "User Management", description: "View users list" },
    { permission: "users.create", category: "User Management", description: "Create new users" },
    { permission: "users.edit", category: "User Management", description: "Edit user information" },
    { permission: "users.delete", category: "User Management", description: "Delete users" },
    
    // Technician Management
    { permission: "technicians.view", category: "Technician Management", description: "View technicians" },
    { permission: "technicians.create", category: "Technician Management", description: "Create technicians" },
    { permission: "technicians.edit", category: "Technician Management", description: "Edit technicians" },
    { permission: "technicians.delete", category: "Technician Management", description: "Delete technicians" },
    { permission: "technicians.rate", category: "Technician Management", description: "Rate technicians" },
    
    // Work Orders
    { permission: "workorders.view", category: "Work Order Management", description: "View work orders" },
    { permission: "workorders.create", category: "Work Order Management", description: "Create work orders" },
    { permission: "workorders.edit", category: "Work Order Management", description: "Edit work orders" },
    { permission: "workorders.assign", category: "Work Order Management", description: "Assign technicians" },
    
    // Proposals
    { permission: "proposals.view", category: "Proposal Management", description: "View proposals" },
    { permission: "proposals.create", category: "Proposal Management", description: "Create proposals" },
    { permission: "proposals.approve", category: "Proposal Management", description: "Approve proposals" },
    
    // Payments
    { permission: "payments.view", category: "Payment Management", description: "View payments" },
    { permission: "payments.create", category: "Payment Management", description: "Create payments" },
    { permission: "payments.approve", category: "Payment Management", description: "Approve payments" },
    
    // System Admin
    { permission: "system.admin", category: "System Administration", description: "Full system access" },
    { permission: "system.settings", category: "System Administration", description: "Manage settings" },
  ];

  const groupedTests = permissionTests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, typeof permissionTests>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permission System Test</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive testing of the advanced permission system
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Username</div>
              <div className="text-lg">{user?.username || 'Not logged in'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Role</div>
              <Badge variant="outline">{getUserRole()}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">System Admin</div>
              <Badge variant={isSystemAdmin() ? "default" : "secondary"}>
                {isSystemAdmin() ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Total Permissions: {userPermissions.length}
            </div>
            <div className="flex flex-wrap gap-1">
              {userPermissions.slice(0, 10).map((permission, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
              {userPermissions.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{userPermissions.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Tests by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedTests).map(([category, tests]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tests.map((test, index) => {
                  const hasAccess = hasPermission(test.permission);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{test.permission}</div>
                        <div className="text-xs text-gray-600">{test.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasAccess ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <Badge variant={hasAccess ? "default" : "secondary"}>
                          {hasAccess ? "Granted" : "Denied"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Permission Guard Test Buttons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AdvancedPermissionGuard permission="users.create">
              <Button className="w-full">Create User</Button>
            </AdvancedPermissionGuard>
            
            <AdvancedPermissionGuard permission="technicians.edit">
              <Button variant="outline" className="w-full">Edit Technician</Button>
            </AdvancedPermissionGuard>
            
            <AdvancedPermissionGuard permission="workorders.approve">
              <Button variant="secondary" className="w-full">Approve Work Order</Button>
            </AdvancedPermissionGuard>
            
            <AdvancedPermissionGuard permission="system.admin">
              <Button variant="destructive" className="w-full">Admin Action</Button>
            </AdvancedPermissionGuard>
            
            <AdvancedPermissionGuard permissions={["payments.view", "payments.create"]} requireAll={true}>
              <Button className="w-full">Full Payment Access</Button>
            </AdvancedPermissionGuard>
            
            <AdvancedPermissionGuard permissions={["proposals.view", "proposals.edit"]} requireAll={false}>
              <Button variant="outline" className="w-full">Any Proposal Access</Button>
            </AdvancedPermissionGuard>
            
            <AdvancedPermissionGuard 
              permission="nonexistent.permission" 
              fallback={<Button disabled className="w-full">No Access</Button>}
            >
              <Button className="w-full">Should Not Show</Button>
            </AdvancedPermissionGuard>
            
            <AdvancedPermissionGuard 
              permission="system.backup"
              hideOnNoPermission={true}
              renderWhenHidden={<div className="text-sm text-gray-500 text-center py-2">Hidden Action</div>}
            >
              <Button className="w-full">System Backup</Button>
            </AdvancedPermissionGuard>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {permissionTests.filter(test => hasPermission(test.permission)).length}
              </div>
              <div className="text-sm text-gray-600">Granted Permissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {permissionTests.filter(test => !hasPermission(test.permission)).length}
              </div>
              <div className="text-sm text-gray-600">Denied Permissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(groupedTests).length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((permissionTests.filter(test => hasPermission(test.permission)).length / permissionTests.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Access Level</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}