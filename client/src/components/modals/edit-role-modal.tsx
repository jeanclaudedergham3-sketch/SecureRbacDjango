import { useState, useEffect } from "react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Permission, RoleWithPermissions } from "@shared/schema";

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleWithPermissions | null;
}

export function EditRoleModal({ isOpen, onClose, role }: EditRoleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const { data: allPermissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
    enabled: isOpen,
  });

  // Initialize form data when role changes
  React.useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions.map(p => p.id));
      setRoleName(role.name);
      setRoleDescription(role.description || "");
    } else {
      setSelectedPermissions([]);
      setRoleName("");
      setRoleDescription("");
    }
  }, [role]);

  const createRoleMutation = useMutation({
    mutationFn: (data: { name: string; description: string; permissionIds: number[] }) =>
      apiRequest("POST", "/api/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: { roleId: number; permissionIds: number[] }) => {
      console.log("Updating role permissions:", data);
      return apiRequest("POST", `/api/roles/${data.roleId}/permissions`, { permissionIds: data.permissionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Update permissions error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSave = () => {
    if (role) {
      // Update existing role permissions
      updatePermissionsMutation.mutate({
        roleId: role.id,
        permissionIds: selectedPermissions,
      });
    } else {
      // Create new role
      if (!roleName.trim()) {
        toast({
          title: "Error",
          description: "Role name is required",
          variant: "destructive",
        });
        return;
      }
      
      createRoleMutation.mutate({
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissionIds: selectedPermissions,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role Permissions" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            {role 
              ? `Configure permissions for the ${role.name} role.`
              : "Create a new role and assign permissions."
            }
          </DialogDescription>
        </DialogHeader>

        {!role && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Enter role description"
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
            <div className="space-y-3">
              {allPermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`permission-${permission.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.name}
                  </Label>
                  {permission.description && (
                    <span className="text-xs text-gray-500">
                      - {permission.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updatePermissionsMutation.isPending || createRoleMutation.isPending}
            >
              {updatePermissionsMutation.isPending || createRoleMutation.isPending 
                ? "Saving..." 
                : role ? "Save Changes" : "Create Role"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
