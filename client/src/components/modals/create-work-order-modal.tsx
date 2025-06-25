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
import { useAuth } from "@/hooks/use-auth";
import type { WorkOrderWithUsers, User } from "@shared/schema";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers | null;
}

export function CreateWorkOrderModal({ isOpen, onClose, workOrder }: CreateWorkOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    location: "",
    estimatedHours: "",
    scheduledDate: "",
    assignedTo: null as number | null,
    technicianId: null as number | null,
    status: "pending",
  });

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (workOrder) {
      setFormData({
        title: workOrder.title || "",
        description: workOrder.description || "",
        priority: workOrder.priority || "medium",
        category: workOrder.category || "",
        location: workOrder.location || "",
        estimatedHours: workOrder.estimatedHours ? workOrder.estimatedHours.toString() : "",
        scheduledDate: workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toISOString().split('T')[0] : "",
        assignedTo: workOrder.assignedTo || null,
        technicianId: workOrder.technicianId || null,
        status: workOrder.status || "pending",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        category: "",
        location: "",
        estimatedHours: "",
        scheduledDate: "",
        assignedTo: null,
        technicianId: null,
        status: "pending",
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
    if (!formData.title.trim() || !formData.description.trim() || !formData.category.trim() || !formData.location.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      location: formData.location,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
      scheduledDate: formData.scheduledDate || null,
      assignedTo: formData.assignedTo,
      technicianId: formData.technicianId,
      status: formData.status,
      requestedBy: user?.id, // Add the required requestedBy field
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Work Order Details</h3>
            
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter work order title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the work to be performed..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="IT Support, Maintenance, Repair..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Building A - 123 Main St, City, State"
                required
              />
            </div>
          </div>

          {/* Assignment & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignment & Timeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assigned User</Label>
                <Select
                  value={formData.assignedTo?.toString() || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value ? parseInt(value) : null }))}
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  placeholder="8.0"
                />
              </div>
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
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