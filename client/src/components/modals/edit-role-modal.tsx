import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

  const { data: allPermissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
    enabled: isOpen,
  });

  // Initialize selected permissions when role changes
  useState(() => {
    if (role) {
      setSelectedPermissions(role.permissions.map(p => p.id));
    }
  }, [role]);

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: { roleId: number; permissionIds: number[] }) =>
      apiRequest("POST", `/api/roles/${data.roleId}/permissions`, { permissionIds: data.permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
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
      updatePermissionsMutation.mutate({
        roleId: role.id,
        permissionIds: selectedPermissions,
      });
    }
  };

  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Role Permissions</DialogTitle>
          <DialogDescription>
            Configure permissions for the {role.name} role.
          </DialogDescription>
        </DialogHeader>

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
            <Button onClick={handleSave} disabled={updatePermissionsMutation.isPending}>
              {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
