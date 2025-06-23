import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Settings, FileText, DollarSign, AlertTriangle, Database, Activity, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Permission, RoleWithPermissions } from "@shared/schema";

interface AdvancedRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleWithPermissions;
}

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  dashboard: {
    name: "Dashboard & Analytics",
    icon: Activity,
    color: "bg-blue-500",
    permissions: ["view_dashboard", "view_analytics", "export_reports"]
  },
  users: {
    name: "User Management",
    icon: Users,
    color: "bg-green-500",
    permissions: ["view_users", "create_users", "edit_users", "delete_users", "manage_user_roles", "reset_passwords", "activate_deactivate_users"]
  },
  roles: {
    name: "Role & Permission Management",
    icon: Shield,
    color: "bg-purple-500",
    permissions: ["view_roles", "create_roles", "edit_roles", "delete_roles", "manage_permissions"]
  },
  equipment: {
    name: "Equipment Management",
    icon: Database,
    color: "bg-indigo-500",
    permissions: ["view_equipment", "create_equipment", "edit_equipment", "delete_equipment", "equipment_maintenance", "equipment_reports"]
  },
  technicians: {
    name: "Technician Management",
    icon: Users,
    color: "bg-teal-500",
    permissions: ["view_technicians", "create_technicians", "edit_technicians", "delete_technicians", "manage_technician_schedules", "view_technician_performance", "manage_technician_payments"]
  },
  workorders: {
    name: "Work Order Management",
    icon: FileText,
    color: "bg-orange-500",
    permissions: ["view_work_orders", "create_work_orders", "edit_work_orders", "delete_work_orders", "assign_work_orders", "approve_work_orders", "close_work_orders", "view_work_order_history"]
  },
  proposals: {
    name: "Proposal Management",
    icon: FileText,
    color: "bg-yellow-500",
    permissions: ["view_proposals", "create_proposals", "edit_proposals", "delete_proposals", "approve_proposals", "proposal_analytics"]
  },
  parts: {
    name: "Parts & Inventory",
    icon: Database,
    color: "bg-pink-500",
    permissions: ["view_parts_requests", "create_parts_requests", "edit_parts_requests", "approve_parts_requests", "manage_inventory", "parts_analytics"]
  },
  files: {
    name: "File & Document Management",
    icon: FileText,
    color: "bg-cyan-500",
    permissions: ["view_files", "upload_files", "delete_files", "manage_signatures", "file_analytics"]
  },
  communication: {
    name: "Communication & Chat",
    icon: Settings,
    color: "bg-gray-500",
    permissions: ["view_chat", "send_messages", "delete_messages", "manage_notifications", "communication_analytics"]
  },
  payments: {
    name: "Payment & Financial",
    icon: DollarSign,
    color: "bg-emerald-500",
    permissions: ["view_payments", "create_payments", "process_payments", "approve_payments", "financial_reports", "invoice_management", "payment_analytics"]
  },
  system: {
    name: "System Administration",
    icon: Settings,
    color: "bg-slate-500",
    permissions: ["system_settings", "manage_backups", "view_audit_logs", "system_maintenance", "manage_integrations"]
  },
  emergency: {
    name: "Emergency & Override",
    icon: AlertTriangle,
    color: "bg-red-500",
    permissions: ["emergency_access", "override_permissions", "system_override", "emergency_shutdown", "critical_alerts"]
  }
};

export function AdvancedRoleModal({ isOpen, onClose, role }: AdvancedRoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions } = useQuery({
    queryKey: ["/api/permissions"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
      });
      setSelectedPermissions(role.permissions?.map(p => p.id) || []);
    } else {
      setFormData({ name: "", description: "" });
      setSelectedPermissions([]);
    }
  }, [role]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create role first
      const roleResponse = await apiRequest("POST", "/api/roles", {
        name: data.name,
        description: data.description
      });
      const newRole = await roleResponse.json();
      
      // Assign permissions to the new role
      for (const permissionId of data.permissions) {
        await apiRequest("POST", `/api/roles/${newRole.id}/permissions`, { permissionId });
      }
      
      return newRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!role?.id) return;
      // Update role basic info first
      const roleResponse = await apiRequest("PUT", `/api/roles/${role.id}`, {
        name: data.name,
        description: data.description
      });
      
      // Update permissions separately
      for (const permissionId of data.permissions) {
        await apiRequest("POST", `/api/roles/${role.id}/permissions`, { permissionId });
      }
      
      return roleResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Success", 
        description: "Role updated successfully",
      });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      permissions: selectedPermissions,
    };

    if (role) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setSelectedPermissions(prev => 
      checked 
        ? [...prev, permissionId]
        : prev.filter(id => id !== permissionId)
    );
  };

  const handleCategoryChange = (categoryKey: string, checked: boolean) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES];
    const categoryPermissions = permissions?.filter(p => 
      category.permissions.includes(p.name)
    ) || [];
    
    if (checked) {
      setSelectedPermissions(prev => [
        ...prev,
        ...categoryPermissions.map(p => p.id).filter(id => !prev.includes(id))
      ]);
    } else {
      setSelectedPermissions(prev => 
        prev.filter(id => !categoryPermissions.some(p => p.id === id))
      );
    }
  };

  const isCategoryChecked = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES];
    const categoryPermissions = permissions?.filter(p => 
      category.permissions.includes(p.name)
    ) || [];
    return categoryPermissions.length > 0 && categoryPermissions.every(p => selectedPermissions.includes(p.id));
  };

  const isCategoryPartiallyChecked = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES];
    const categoryPermissions = permissions?.filter(p => 
      category.permissions.includes(p.name)
    ) || [];
    const checkedCount = categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length;
    return checkedCount > 0 && checkedCount < categoryPermissions.length;
  };

  const filteredPermissions = permissions?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {role ? "Edit Role" : "Create New Role"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter role description"
                />
              </div>
            </div>
            
            <div>
              <Label>Permissions ({selectedPermissions.length} selected)</Label>
              <Tabs defaultValue="categories" className="mt-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="categories">By Category</TabsTrigger>
                  <TabsTrigger value="search">Search & Filter</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="categories" className="mt-4">
                  <ScrollArea className="h-96 border rounded-md p-4">
                    <div className="space-y-6">
                      {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                        const Icon = category.icon;
                        const categoryPermissions = permissions?.filter(p => 
                          category.permissions.includes(p.name)
                        ) || [];
                        
                        return (
                          <Card key={key} className="border-l-4" style={{borderLeftColor: category.color.replace('bg-', '').replace('-500', '')}}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Icon className="h-5 w-5" />
                                  <CardTitle className="text-lg">{category.name}</CardTitle>
                                  <Badge variant="secondary">
                                    {categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length}/{categoryPermissions.length}
                                  </Badge>
                                </div>
                                <Checkbox
                                  checked={isCategoryChecked(key)}
                                  onCheckedChange={(checked) => handleCategoryChange(key, checked as boolean)}
                                />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 gap-3">
                                {categoryPermissions.map((permission) => (
                                  <div key={permission.id} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`permission-${permission.id}`}
                                      checked={selectedPermissions.includes(permission.id)}
                                      onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                                    />
                                    <Label 
                                      htmlFor={`permission-${permission.id}`}
                                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Fixed footer with buttons */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t mt-4 bg-white">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {role ? "Updating..." : "Creating..."}
                </>
              ) : (
                role ? "Update Role" : "Create Role"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}