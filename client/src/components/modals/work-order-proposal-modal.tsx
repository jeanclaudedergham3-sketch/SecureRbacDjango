import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import type { WorkOrderWithUsers, WorkOrderProposal } from "@shared/schema";

interface WorkOrderProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers;
}

interface LaborEntry {
  transactionDate: string;
  payRate: string;
  regularHours: string;
  otHours: string;
  otScale: string;
  remark: string;
}

interface PartsEntry {
  transactionDate: string;
  unitCost: string;
  quantity: string;
  remark: string;
}

interface ServicesEntry {
  transactionDate: string;
  transactionType: string;
  unitCost: string;
  quantity: string;
  remark: string;
}

export function WorkOrderProposalModal({ isOpen, onClose, workOrder }: WorkOrderProposalModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [partsEntries, setPartsEntries] = useState<PartsEntry[]>([]);
  const [servicesEntries, setServicesEntries] = useState<ServicesEntry[]>([]);
  const [message, setMessage] = useState("");

  // Fetch existing proposal
  const { data: proposal, isLoading } = useQuery<WorkOrderProposal | null>({
    queryKey: [`/api/work-orders/${workOrder.id}/proposal`],
    enabled: isOpen,
  });

  // Load existing proposal data
  useEffect(() => {
    if (isOpen) {
      if (proposal) {
        try {
          setLaborEntries(proposal.laborData ? JSON.parse(proposal.laborData) : [createEmptyLaborEntry()]);
          setPartsEntries(proposal.partsData ? JSON.parse(proposal.partsData) : [createEmptyPartsEntry()]);
          setServicesEntries(proposal.servicesData ? JSON.parse(proposal.servicesData) : [createEmptyServicesEntry()]);
          setMessage(proposal.message || "");
        } catch (error) {
          console.error("Error parsing proposal data:", error);
          // Initialize with empty entries on error
          setLaborEntries([createEmptyLaborEntry()]);
          setPartsEntries([createEmptyPartsEntry()]);
          setServicesEntries([createEmptyServicesEntry()]);
          setMessage("");
        }
      } else {
        // Initialize with empty entries for new proposal
        setLaborEntries([createEmptyLaborEntry()]);
        setPartsEntries([createEmptyPartsEntry()]);
        setServicesEntries([createEmptyServicesEntry()]);
        setMessage("");
      }
    }
  }, [proposal, isOpen]);

  function createEmptyLaborEntry(): LaborEntry {
    return {
      transactionDate: new Date().toISOString().split('T')[0],
      payRate: "",
      regularHours: "",
      otHours: "",
      otScale: "1.5",
      remark: ""
    };
  }

  function createEmptyPartsEntry(): PartsEntry {
    return {
      transactionDate: new Date().toISOString().split('T')[0],
      unitCost: "",
      quantity: "",
      remark: ""
    };
  }

  function createEmptyServicesEntry(): ServicesEntry {
    return {
      transactionDate: new Date().toISOString().split('T')[0],
      transactionType: "",
      unitCost: "",
      quantity: "",
      remark: ""
    };
  }

  const saveProposalMutation = useMutation({
    mutationFn: (data: any) => 
      proposal 
        ? apiRequest("PUT", `/api/work-orders/${workOrder.id}/proposal`, data)
        : apiRequest("POST", `/api/work-orders/${workOrder.id}/proposal`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/proposal`] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: "Proposal saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save proposal",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => 
      apiRequest("PUT", `/api/work-orders/${workOrder.id}/proposal/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/proposal`] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: "Proposal status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update proposal status",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const proposalData = {
      workOrderId: workOrder.id,
      laborData: JSON.stringify(laborEntries),
      partsData: JSON.stringify(partsEntries),
      servicesData: JSON.stringify(servicesEntries),
      message,
      status: proposal?.status || "pending"
    };

    saveProposalMutation.mutate(proposalData);
  };

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Loading Proposal</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading proposal...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const addLaborEntry = () => {
    setLaborEntries([...laborEntries, createEmptyLaborEntry()]);
  };

  const removeLaborEntry = (index: number) => {
    setLaborEntries(laborEntries.filter((_, i) => i !== index));
  };

  const updateLaborEntry = (index: number, field: string, value: string) => {
    const updated = [...laborEntries];
    updated[index] = { ...updated[index], [field]: value };
    setLaborEntries(updated);
  };

  const addPartsEntry = () => {
    setPartsEntries([...partsEntries, createEmptyPartsEntry()]);
  };

  const removePartsEntry = (index: number) => {
    setPartsEntries(partsEntries.filter((_, i) => i !== index));
  };

  const updatePartsEntry = (index: number, field: string, value: string) => {
    const updated = [...partsEntries];
    updated[index] = { ...updated[index], [field]: value };
    setPartsEntries(updated);
  };

  const addServicesEntry = () => {
    setServicesEntries([...servicesEntries, createEmptyServicesEntry()]);
  };

  const removeServicesEntry = (index: number) => {
    setServicesEntries(servicesEntries.filter((_, i) => i !== index));
  };

  const updateServicesEntry = (index: number, field: string, value: string) => {
    const updated = [...servicesEntries];
    updated[index] = { ...updated[index], [field]: value };
    setServicesEntries(updated);
  };

  const calculateLaborTotal = () => {
    return laborEntries.reduce((total, entry) => {
      const payRate = parseFloat(entry.payRate) || 0;
      const regularHours = parseFloat(entry.regularHours) || 0;
      const otHours = parseFloat(entry.otHours) || 0;
      const otScale = parseFloat(entry.otScale) || 1.5;
      
      return total + (payRate * regularHours) + (payRate * otHours * otScale);
    }, 0);
  };

  const calculatePartsTotal = () => {
    return partsEntries.reduce((total, entry) => {
      const unitCost = parseFloat(entry.unitCost) || 0;
      const quantity = parseFloat(entry.quantity) || 0;
      return total + (unitCost * quantity);
    }, 0);
  };

  const calculateServicesTotal = () => {
    return servicesEntries.reduce((total, entry) => {
      const unitCost = parseFloat(entry.unitCost) || 0;
      const quantity = parseFloat(entry.quantity) || 0;
      return total + (unitCost * quantity);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Work Order Proposal - {workOrder.workOrderNumber}</DialogTitle>
              <DialogDescription>
                Manage labor, parts, and services for {workOrder.clientName}
              </DialogDescription>
            </div>
            {proposal && (
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Labor Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Labor</CardTitle>
                <Button onClick={addLaborEntry} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {laborEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-7 gap-4 items-end">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={entry.transactionDate}
                        onChange={(e) => updateLaborEntry(index, "transactionDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Pay Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="$/hr"
                        value={entry.payRate}
                        onChange={(e) => updateLaborEntry(index, "payRate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Regular Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0"
                        value={entry.regularHours}
                        onChange={(e) => updateLaborEntry(index, "regularHours", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>OT Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0"
                        value={entry.otHours}
                        onChange={(e) => updateLaborEntry(index, "otHours", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>OT Scale</Label>
                      <Select
                        value={entry.otScale}
                        onValueChange={(value) => updateLaborEntry(index, "otScale", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="2.0">2.0x</SelectItem>
                          <SelectItem value="2.5">2.5x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Remark</Label>
                      <Input
                        placeholder="Notes"
                        value={entry.remark}
                        onChange={(e) => updateLaborEntry(index, "remark", e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeLaborEntry(index)}
                      disabled={laborEntries.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-right">
                  <strong>Labor Total: ${calculateLaborTotal().toFixed(2)}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parts Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Parts</CardTitle>
                <Button onClick={addPartsEntry} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partsEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 items-end">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={entry.transactionDate}
                        onChange={(e) => updatePartsEntry(index, "transactionDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="$"
                        value={entry.unitCost}
                        onChange={(e) => updatePartsEntry(index, "unitCost", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={entry.quantity}
                        onChange={(e) => updatePartsEntry(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Remark</Label>
                      <Input
                        placeholder="Notes"
                        value={entry.remark}
                        onChange={(e) => updatePartsEntry(index, "remark", e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePartsEntry(index)}
                      disabled={partsEntries.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-right">
                  <strong>Parts Total: ${calculatePartsTotal().toFixed(2)}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Services</CardTitle>
                <Button onClick={addServicesEntry} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {servicesEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 items-end">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={entry.transactionDate}
                        onChange={(e) => updateServicesEntry(index, "transactionDate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Input
                        placeholder="Service type"
                        value={entry.transactionType}
                        onChange={(e) => updateServicesEntry(index, "transactionType", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="$"
                        value={entry.unitCost}
                        onChange={(e) => updateServicesEntry(index, "unitCost", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={entry.quantity}
                        onChange={(e) => updateServicesEntry(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Remark</Label>
                      <Input
                        placeholder="Notes"
                        value={entry.remark}
                        onChange={(e) => updateServicesEntry(index, "remark", e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeServicesEntry(index)}
                      disabled={servicesEntries.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-right">
                  <strong>Services Total: ${calculateServicesTotal().toFixed(2)}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Grand Total */}
          <div className="text-right text-xl font-bold">
            Grand Total: ${(calculateLaborTotal() + calculatePartsTotal() + calculateServicesTotal()).toFixed(2)}
          </div>

          {/* Message Section */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Additional comments or notes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="space-x-2">
              {proposal && proposal.status === "pending" && (
                <PermissionGuard permission="manage_work_orders">
                  <Button 
                    onClick={() => handleStatusUpdate("approved")}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateStatusMutation.isPending ? "Approving..." : "Approve"}
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updateStatusMutation.isPending}
                    variant="destructive"
                  >
                    {updateStatusMutation.isPending ? "Cancelling..." : "Cancel"}
                  </Button>
                </PermissionGuard>
              )}
              {proposal && proposal.status === "pending" && !user?.permissions?.includes("manage_work_orders") && (
                <div className="text-sm text-gray-500 italic">
                  Only managers can approve or cancel proposals
                </div>
              )}
            </div>
            
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <PermissionGuard permission="workorders.create">
                <Button 
                  onClick={handleSave}
                  disabled={saveProposalMutation.isPending}
                >
                  {saveProposalMutation.isPending ? "Saving..." : proposal ? "Update Proposal" : "Save Proposal"}
                </Button>
              </PermissionGuard>
              {proposal && (
                <Button variant="outline" onClick={() => window.print()}>
                  Print
                </Button>
              )}
              {!user?.permissions?.includes("workorders.create") && (
                <div className="text-sm text-gray-500 italic">
                  View-only mode - Only authorized users can edit proposals
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}