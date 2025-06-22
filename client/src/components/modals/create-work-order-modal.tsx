import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrderWithUser, User } from "@shared/schema";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUser | null;
}

export function CreateWorkOrderModal({ isOpen, onClose, workOrder }: CreateWorkOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    country: "",
    city: "",
    street: "",
    nte: "",
    tnte: "",
    startDate: "",
    endDate: "",
    assignedUserId: "",
    status: "active",
  });

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (workOrder) {
      setFormData({
        clientName: workOrder.clientName || "",
        country: workOrder.country || "",
        city: workOrder.city || "",
        street: workOrder.street || "",
        nte: workOrder.nte || "",
        tnte: workOrder.tnte || "",
        startDate: workOrder.startDate ? new Date(workOrder.startDate).toISOString().split('T')[0] : "",
        endDate: workOrder.endDate ? new Date(workOrder.endDate).toISOString().split('T')[0] : "",
        assignedUserId: workOrder.assignedUserId?.toString() || "",
        status: workOrder.status || "active",
      });
    } else {
      setFormData({
        clientName: "",
        country: "",
        city: "",
        street: "",
        nte: "",
        tnte: "",
        startDate: "",
        endDate: "",
        assignedUserId: "",
        status: "active",
      });
    }
  }, [workOrder, isOpen]);

  const createWorkOrderMutation = useMutation({
    mutationFn: (data: any) => 
      workOrder 
        ? apiRequest("PUT", `/api/work-orders/${workOrder.id}`, data)
        : apiRequest("POST", "/api/work-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: workOrder ? "Work order updated successfully" : "Work order created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save work order",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.clientName.trim() || !formData.country.trim() || !formData.city.trim() || 
        !formData.street.trim() || !formData.nte.trim() || !formData.tnte.trim() ||
        !formData.startDate || !formData.endDate || !formData.assignedUserId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      assignedUserId: parseInt(formData.assignedUserId),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    createWorkOrderMutation.mutate(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workOrder ? "Edit Work Order" : "Create New Work Order"}</DialogTitle>
          <DialogDescription>
            {workOrder ? "Update work order information and details." : "Enter work order details and assign to a user."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <Label htmlFor="street">Street *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Street address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financial Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nte">NTE (without tax) *</Label>
                <Input
                  id="nte"
                  type="number"
                  step="0.01"
                  value={formData.nte}
                  onChange={(e) => setFormData(prev => ({ ...prev, nte: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="tnte">TNTE (including tax) *</Label>
                <Input
                  id="tnte"
                  type="number"
                  step="0.01"
                  value={formData.tnte}
                  onChange={(e) => setFormData(prev => ({ ...prev, tnte: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Project Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Project Timeline</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignment</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedUserId">Assigned User *</Label>
                <Select
                  value={formData.assignedUserId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedUserId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createWorkOrderMutation.isPending}
            >
              {createWorkOrderMutation.isPending 
                ? "Saving..." 
                : workOrder ? "Update Work Order" : "Create Work Order"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}