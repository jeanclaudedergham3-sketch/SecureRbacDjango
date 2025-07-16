import { useState } from "react";
import { Plus, Calendar, DollarSign, User, MapPin, Eye, Edit, Trash2, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { CreateWorkOrderModal } from "@/components/modals/create-work-order-modal";
import { WorkOrderDetailsModal } from "@/components/modals/work-order-details-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WorkOrderWithUsers } from "@shared/schema";

export default function WorkOrders() {
  const { user, permissions } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithUsers | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderWithUsers | null>(null);

  const { data: workOrders = [], isLoading, refetch } = useQuery<WorkOrderWithUsers[]>({
    queryKey: ["/api/work-orders"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  // Filter work orders based on user permissions
  const filteredWorkOrders = workOrders.filter(workOrder => {
    // Admins and managers can see all work orders
    if (permissions?.includes("workorders.view")) {
      return true;
    }
    // Regular users can only see work orders assigned to them
    try {
      const assignedUserIds = workOrder.assignedUsers ? workOrder.assignedUsers.map(u => u.id) : [];
      return assignedUserIds.includes(user?.id || 0);
    } catch {
      return false;
    }
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Work Orders</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage work orders, proposals, and project tracking.
            </p>
          </div>
          <PermissionGuard permission="workorders.create">
            <div className="space-x-2">
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Work Order
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </PermissionGuard>
        </div>

        {/* Work Order Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkOrders.map((workOrder) => (
            <Card key={workOrder.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-blue-600">
                      {workOrder.workOrderNumber}
                    </CardTitle>
                    <CardDescription className="font-medium text-gray-900 mt-1">
                      {workOrder.title}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(workOrder.status)}>
                    {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">
                    {workOrder.location}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <div className="flex flex-wrap gap-1">
                    <span>Assigned to:</span>
                    {workOrder.assignedUsers && workOrder.assignedUsers.length > 0 ? (
                      workOrder.assignedUsers.map((user, index) => (
                        <span key={user.id}>
                          {user.firstName} {user.lastName}
                          {index < workOrder.assignedUsers!.length - 1 && ", "}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">No users assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {workOrder.scheduledDate ? formatDate(workOrder.scheduledDate) : 'Not scheduled'}
                    {workOrder.completedDate && ` - Completed: ${formatDate(workOrder.completedDate)}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                    <span className="font-medium">
                      Est. Hours: {workOrder.estimatedHours || 'TBD'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    Priority: {workOrder.priority}
                  </div>
                </div>
              </CardContent>

              <div className="px-6 py-3 bg-gray-50 border-t flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWorkOrder(workOrder)}
                  className="flex-1 mr-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                
                <PermissionGuard permission="workorders.view">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingWorkOrder(workOrder)}
                    className="flex-1 ml-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </PermissionGuard>
              </div>
            </Card>
          ))}
        </div>

        {filteredWorkOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No work orders found</h3>
              <p className="text-sm">
                {permissions?.includes("workorders.create") 
                  ? "Get started by creating your first work order."
                  : "You don't have any assigned work orders yet."
                }
              </p>
            </div>
          </div>
        )}
      </div>

      <CreateWorkOrderModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        workOrder={null}
      />

      {editingWorkOrder && (
        <CreateWorkOrderModal
          isOpen={!!editingWorkOrder}
          onClose={() => setEditingWorkOrder(null)}
          workOrder={editingWorkOrder}
        />
      )}

      {selectedWorkOrder && (
        <WorkOrderDetailsModal
          isOpen={!!selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          workOrder={selectedWorkOrder}
        />
      )}
    </div>
  );
}