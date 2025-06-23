import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrderWithUsers, User } from "@shared/schema";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers | null;
}

export function CreateWorkOrderModal({ isOpen, onClose, workOrder }: CreateWorkOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    country: "",
    city: "",
    street: "",
    zipCode: "",
    description: "",
    urgency: "medium",
    equipmentType: "",
    problemDescription: "",
    nte: "",
    tnte: "",
    startDate: "",
    endDate: "",
    estimatedHours: "",
    specialInstructions: "",
    accessInstructions: "",
    safetyRequirements: "",
    assignedUserIds: [] as number[],
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
        clientPhone: workOrder.clientPhone || "",
        clientEmail: workOrder.clientEmail || "",
        country: workOrder.country || "",
        city: workOrder.city || "",
        street: workOrder.street || "",
        zipCode: workOrder.zipCode || "",
        description: workOrder.description || "",
        urgency: workOrder.urgency || "medium",
        equipmentType: workOrder.equipmentType || "",
        problemDescription: workOrder.problemDescription || "",
        nte: workOrder.nte || "",
        tnte: workOrder.tnte || "",
        startDate: workOrder.startDate ? new Date(workOrder.startDate).toISOString().split('T')[0] : "",
        endDate: workOrder.endDate ? new Date(workOrder.endDate).toISOString().split('T')[0] : "",
        estimatedHours: workOrder.estimatedHours || "",
        specialInstructions: workOrder.specialInstructions || "",
        accessInstructions: workOrder.accessInstructions || "",
        safetyRequirements: workOrder.safetyRequirements || "",
        assignedUserIds: workOrder.assignedUsers?.map(user => user.id) || [],
        status: workOrder.status || "active",
      });
      
      
    } else {
      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        country: "",
        city: "",
        street: "",
        zipCode: "",
        description: "",
        urgency: "medium",
        equipmentType: "",
        problemDescription: "",
        nte: "",
        tnte: "",
        startDate: "",
        endDate: "",
        estimatedHours: "",
        specialInstructions: "",
        accessInstructions: "",
        safetyRequirements: "",
        assignedUserIds: [],
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
        !formData.street.trim() || !formData.description.trim() || !formData.nte.trim() || !formData.tnte.trim() ||
        !formData.startDate || !formData.endDate || formData.assignedUserIds.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and assign at least one user",
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
      assignedUserIds: JSON.stringify(formData.assignedUserIds),
      startDate: formData.startDate,
      endDate: formData.endDate,
    };

    createWorkOrderMutation.mutate(submitData, {
      onSuccess: () => {
        // Force refresh of work orders list
        queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
        onClose();
      }
    });
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="+1-555-0123"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Work Details</h3>
            
            <div>
              <Label htmlFor="description">Work Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the work to be performed..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="equipmentType">Equipment Type</Label>
                <Input
                  id="equipmentType"
                  value={formData.equipmentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipmentType: e.target.value }))}
                  placeholder="HVAC, Electrical, Plumbing..."
                />
              </div>
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
            </div>

            <div>
              <Label htmlFor="problemDescription">Problem Description</Label>
              <Textarea
                id="problemDescription"
                value={formData.problemDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, problemDescription: e.target.value }))}
                placeholder="Detailed description of the problem or issue..."
                rows={2}
              />
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Instructions & Requirements</h3>
            
            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                placeholder="Any special instructions for the technician..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="accessInstructions">Access Instructions</Label>
              <Textarea
                id="accessInstructions"
                value={formData.accessInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, accessInstructions: e.target.value }))}
                placeholder="How to access the site, key codes, contact person..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="safetyRequirements">Safety Requirements</Label>
              <Textarea
                id="safetyRequirements"
                value={formData.safetyRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, safetyRequirements: e.target.value }))}
                placeholder="PPE requirements, safety protocols, hazards to be aware of..."
                rows={2}
              />
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
            
            <div className="space-y-4">
              <div>
                <Label>Assigned Users * (Select multiple users)</Label>
                <Card className="mt-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Selected Users ({formData.assignedUserIds.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {formData.assignedUserIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.assignedUserIds.map((userId) => {
                          const user = users.find(u => u.id === userId);
                          return user ? (
                            <div key={userId} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                              <span>{user.firstName} {user.lastName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    assignedUserIds: prev.assignedUserIds.filter(id => id !== userId)
                                  }));
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No users selected</p>
                    )}
                    
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="text-sm font-medium">Available Users:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {users.filter(user => !formData.assignedUserIds.includes(user.id)).map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    assignedUserIds: [...prev.assignedUserIds, user.id]
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer">
                              {user.firstName} {user.lastName} ({user.username})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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