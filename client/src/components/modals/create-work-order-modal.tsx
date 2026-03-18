import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { WorkOrderWithUsers } from "@shared/schema";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers | null;
}

export function CreateWorkOrderModal({ isOpen, onClose, workOrder }: CreateWorkOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientWorkOrderNumber: "",
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
    teamId: "",
    totalPayment: "",
    status: "active",
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ["/api/technicians"],
  });

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

  useEffect(() => {
    if (workOrder) {
      setFormData({
        clientName: workOrder.clientName || workOrder.title || "",
        clientPhone: workOrder.clientPhone || "",
        clientEmail: workOrder.clientEmail || "",
        clientWorkOrderNumber: workOrder.clientWorkOrderNumber || "",
        country: workOrder.country || "",
        city: workOrder.city || "",
        street: workOrder.street || "",
        zipCode: workOrder.zipCode || "",
        description: workOrder.description || "",
        urgency: workOrder.priority || "medium",
        equipmentType: workOrder.equipmentType || workOrder.category || "",
        problemDescription: workOrder.problemDescription || "",
        nte: workOrder.nte || "",
        tnte: workOrder.tnte || "",
        totalPayment: (workOrder as any).totalPayment || "",
        startDate: workOrder.startDate ? new Date(workOrder.startDate).toISOString().split('T')[0] :
                   (workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toISOString().split('T')[0] : ""),
        endDate: workOrder.endDate ? new Date(workOrder.endDate).toISOString().split('T')[0] : "",
        estimatedHours: workOrder.estimatedHours ? workOrder.estimatedHours.toString() : "",
        specialInstructions: workOrder.specialInstructions || "",
        accessInstructions: workOrder.accessInstructions || "",
        safetyRequirements: workOrder.safetyRequirements || "",
        teamId: (workOrder as any).teamId ? String((workOrder as any).teamId) : "",
        status: workOrder.status || "active",
      });
    } else {
      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        clientWorkOrderNumber: "",
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
        totalPayment: "",
        startDate: "",
        endDate: "",
        estimatedHours: "",
        specialInstructions: "",
        accessInstructions: "",
        safetyRequirements: "",
        teamId: "",
        status: "active",
      });
    }
  }, [workOrder, isOpen]);

  const selectedTeam = (teams as any[]).find((t: any) => String(t.id) === formData.teamId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName.trim() || !formData.country.trim() || !formData.city.trim() ||
        !formData.street.trim() || !formData.description.trim() ||
        !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.teamId) {
      toast({
        title: "Error",
        description: "Please assign a team to this work order",
        variant: "destructive",
      });
      return;
    }

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
      title: formData.clientName,
      description: formData.description,
      priority: formData.urgency,
      category: formData.equipmentType,
      location: `${formData.street}, ${formData.city}, ${formData.country}`,
      estimatedHours: formData.estimatedHours || null,
      scheduledDate: formData.startDate || null,
      status: formData.status,
      requestedBy: user?.id,
      teamId: formData.teamId ? parseInt(formData.teamId) : null,
      // Client Information
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail,
      clientWorkOrderNumber: formData.clientWorkOrderNumber,
      // Address Information
      country: formData.country,
      city: formData.city,
      street: formData.street,
      zipCode: formData.zipCode,
      // Work Details
      equipmentType: formData.equipmentType,
      problemDescription: formData.problemDescription,
      nte: formData.nte || null,
      tnte: formData.tnte || null,
      totalPayment: formData.totalPayment || null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      urgency: formData.urgency,
      // Instructions
      specialInstructions: formData.specialInstructions,
      accessInstructions: formData.accessInstructions,
      safetyRequirements: formData.safetyRequirements,
    };

    createWorkOrderMutation.mutate(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workOrder ? "Edit Work Order" : "Create New Work Order"}</DialogTitle>
          <DialogDescription>
            {workOrder ? "Update work order information and details." : "Enter complete work order details including client information, timeline, and team assignment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Client Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="clientWorkOrderNumber">Client Work Order Number</Label>
                <Input
                  id="clientWorkOrderNumber"
                  value={formData.clientWorkOrderNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientWorkOrderNumber: e.target.value }))}
                  placeholder="Enter client's work order number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <h3 className="text-lg font-medium border-b pb-2">Work Details</h3>

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
                    <SelectItem value="urgent">Urgent</SelectItem>
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

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Instructions & Requirements</h3>

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
            <h3 className="text-lg font-medium border-b pb-2">Financial Details <span className="text-sm text-gray-400 font-normal">(optional — can be filled later from the Overview)</span></h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nte">NTE (without tax)</Label>
                <Input
                  id="nte"
                  type="number"
                  step="0.01"
                  value={formData.nte}
                  onChange={(e) => setFormData(prev => ({ ...prev, nte: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="tnte">TNTE (including tax)</Label>
                <Input
                  id="tnte"
                  type="number"
                  step="0.01"
                  value={formData.tnte}
                  onChange={(e) => setFormData(prev => ({ ...prev, tnte: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="totalPayment">Total Payment</Label>
                <Input
                  id="totalPayment"
                  type="number"
                  step="0.01"
                  value={formData.totalPayment}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPayment: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Project Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Project Timeline</h3>

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

          {/* Team Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Team Assignment</h3>

            <div>
              <Label>Assign Team *</Label>
              <Select
                value={formData.teamId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a team..." />
                </SelectTrigger>
                <SelectContent>
                  {(teams as any[]).length === 0 ? (
                    <SelectItem value="none" disabled>No teams available — create a team first</SelectItem>
                  ) : (
                    (teams as any[]).map((team: any) => (
                      <SelectItem key={team.id} value={String(team.id)}>
                        {team.name}
                        {team.members?.length ? ` (${team.members.length} member${team.members.length !== 1 ? "s" : ""})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Show selected team details */}
            {selectedTeam && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">{selectedTeam.name}</span>
                  {selectedTeam.leadTechnicianId && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      Lead: {(() => {
                        const lead = (technicians as any[]).find((t: any) => t.id === selectedTeam.leadTechnicianId);
                        return lead ? `${lead.firstName} ${lead.lastName}` : `Tech #${selectedTeam.leadTechnicianId}`;
                      })()}
                    </Badge>
                  )}
                </div>
                {selectedTeam.description && (
                  <p className="text-sm text-blue-700 mb-2">{selectedTeam.description}</p>
                )}
                {selectedTeam.members && selectedTeam.members.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTeam.members.map((member: any) => {
                      const tech = (technicians as any[]).find((t: any) => t.id === member.technicianId);
                      return (
                        <span key={member.id} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                          {tech ? `${tech.firstName} ${tech.lastName}` : `Tech #${member.technicianId}`}
                        </span>
                      );
                    })}
                  </div>
                )}
                {(!selectedTeam.members || selectedTeam.members.length === 0) && (
                  <p className="text-xs text-blue-600 italic">This team has no members yet</p>
                )}
              </div>
            )}

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

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
