import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, User, FileText, MessageSquare, CreditCard, Receipt, Upload, Hammer, DollarSign, Plus } from "lucide-react";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { WorkOrderProposalModal } from "@/components/modals/work-order-proposal-modal";
import { CreateInvoiceModal } from "@/components/modals/create-invoice-modal";
import { PartsRequestModal } from "@/components/modals/parts-request-modal";
import { FileUploadModal } from "@/components/modals/file-upload-modal";
import { ChatModal } from "@/components/modals/chat-modal";
import { PaymentRequestModal } from "@/components/modals/payment-request-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Technician } from "@shared/schema";
import { InvoiceManagement } from "../invoice-management";

import { useAuth } from "@/hooks/use-auth";
import type { WorkOrderWithUsers } from "@shared/schema";

interface WorkOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers;
}

const paymentRequestSchema = z.object({
  technicianId: z.number().min(1, "Technician is required"),
  paymentMethods: z.array(z.string()).min(1, "At least one payment method is required"),
  amountRequested: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().optional(),
});

type PaymentRequestFormData = z.infer<typeof paymentRequestSchema>;

export function WorkOrderDetailsModal({ isOpen, onClose, workOrder }: WorkOrderDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentRequestModalOpen, setIsPaymentRequestModalOpen] = useState(false);
  const [isPartsRequestModalOpen, setIsPartsRequestModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isPaymentRequestOpen, setIsPaymentRequestOpen] = useState(false);
  const [isViewProposalModalOpen, setIsViewProposalModalOpen] = useState(false);
  const [isViewPartsModalOpen, setIsViewPartsModalOpen] = useState(false);
  const [isViewFilesModalOpen, setIsViewFilesModalOpen] = useState(false);
  const [isViewChatModalOpen, setIsViewChatModalOpen] = useState(false);
  const [isViewPaymentModalOpen, setIsViewPaymentModalOpen] = useState(false);

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: proposalData } = useQuery({
    queryKey: [`/api/work-orders/${workOrder?.id}/proposal`],
    enabled: !!workOrder?.id,
  });

  const { data: partsRequests = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrder?.id}/parts-requests`],
    enabled: !!workOrder?.id,
  });

  const { data: workOrderFiles = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrder?.id}/files`],
    enabled: !!workOrder?.id,
  });

  const { data: workOrderChats = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrder?.id}/chats`],
    enabled: !!workOrder?.id,
  });



  const { data: existingPayments = [] } = useQuery({
    queryKey: [`/api/work-orders/${workOrder?.id}/payments`],
    enabled: !!workOrder?.id,
  });

  const paymentForm = useForm<PaymentRequestFormData>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      technicianId: 0,
      paymentMethods: [],
      amountRequested: "",
      description: "",
    },
  });

  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

  // Available payment methods with details
  const paymentMethodsInfo = {
    bank_transfer: {
      name: "Bank Transfer",
      description: "Direct bank account transfer",
      icon: "🏦",
      details: ["Account Number", "Routing Number", "Bank Name"]
    },
    cash: {
      name: "Cash",
      description: "Cash payment on-site", 
      icon: "💵",
      details: ["On-site pickup location"]
    },
    check: {
      name: "Check",
      description: "Physical or digital check",
      icon: "📋",
      details: ["Payable to", "Mailing address"]
    },
    digital_wallet: {
      name: "Digital Wallet",
      description: "PayPal, Venmo, CashApp, etc.",
      icon: "📱",
      details: ["PayPal Link", "Venmo", "CashApp", "Zelle", "QR Code"]
    },
    wire_transfer: {
      name: "Wire Transfer", 
      description: "International wire transfer",
      icon: "🌐",
      details: ["SWIFT Code", "Account Details", "Bank Address"]
    }
  };

  // Get technician's available payment methods
  const getAvailablePaymentMethods = (technician: Technician) => {
    try {
      return technician.paymentMethods ? JSON.parse(technician.paymentMethods) : ["bank_transfer", "cash"];
    } catch {
      return ["bank_transfer", "cash"];
    }
  };

  // Get technician's payment details
  const getPaymentDetails = (technician: Technician) => {
    try {
      return technician.paymentDetails ? JSON.parse(technician.paymentDetails) : {};
    } catch {
      return {};
    }
  };



  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentRequestFormData) => 
      apiRequest("POST", "/api/payments", {
        workOrderId: workOrder.id,
        technicianId: data.technicianId,
        paymentMethod: JSON.stringify(data.paymentMethods),
        amountRequested: data.amountRequested,
        description: data.description || "",
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment request created successfully",
      });
      setIsPaymentRequestOpen(false);
      paymentForm.reset();
      setSelectedTechnician(null);
      setSelectedPaymentMethods([]);
      // Invalidate payment cache to refresh payment manager and work order payments
      queryClient.invalidateQueries({ queryKey: ["/api/payments/all"] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/payments`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSubmit = (data: PaymentRequestFormData) => {
    console.log("Submitting payment request:", data);
    console.log("Selected payment methods:", selectedPaymentMethods);
    createPaymentMutation.mutate({
      ...data,
      paymentMethods: selectedPaymentMethods
    });
  };

  const handleTechnicianChange = (value: string) => {
    const technicianId = parseInt(value);
    const technician = technicians.find(t => t.id === technicianId);
    setSelectedTechnician(technician || null);
    setSelectedPaymentMethods([]);
    paymentForm.setValue("technicianId", technicianId);
    paymentForm.setValue("paymentMethods", []);
  };

  const handlePaymentMethodToggle = (method: string, checked: boolean) => {
    const newMethods = checked 
      ? [...selectedPaymentMethods, method]
      : selectedPaymentMethods.filter(m => m !== method);
    
    setSelectedPaymentMethods(newMethods);
    paymentForm.setValue("paymentMethods", newMethods);
  };


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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  // Check if user can access this work order (assigned user or has manage permission)
  const canAccess = (() => {
    if (user?.permissions?.includes("manage_work_orders")) return true;
    
    try {
      const assignedUserIds = workOrder.assignedUserIds ? JSON.parse(workOrder.assignedUserIds) : [];
      return assignedUserIds.includes(user?.id);
    } catch {
      return false;
    }
  })();

  if (!canAccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to view this work order.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-blue-600">
                {workOrder.workOrderNumber}
              </DialogTitle>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {workOrder.clientName}
              </p>
            </div>
            <Badge className={getStatusColor(workOrder.status)}>
              {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        {/* Lock notification if work order is locked */}
        {workOrder.isLocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <Receipt className="h-5 w-5" />
              <span className="font-medium">Work Order Locked</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              This work order is locked because its invoice has been marked as paid. 
              All editing, creation, and modification functions are disabled. Data is read-only.
            </p>
          </div>
        )}

        {/* Action Buttons - Disabled when locked */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <PermissionGuard permission="manage_work_orders">
            <Button
              onClick={() => workOrder.isLocked ? toast({
                title: "Action Blocked",
                description: "Cannot create proposals - work order is locked due to paid invoice.",
                variant: "destructive"
              }) : setIsProposalModalOpen(true)}
              className="flex items-center justify-center gap-2"
              disabled={workOrder.isLocked}
            >
              <FileText className="h-4 w-4" />
              {workOrder.isLocked ? "Locked" : "Create Proposal"}
            </Button>
          </PermissionGuard>
          
          <PermissionGuard permission="manage_work_orders">
            <Button
              onClick={() => workOrder.isLocked ? toast({
                title: "Action Blocked", 
                description: "Cannot modify invoices - work order is locked due to paid invoice.",
                variant: "destructive"
              }) : setIsInvoiceModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={workOrder.isLocked}
            >
              <Receipt className="h-4 w-4" />
              {workOrder.isLocked ? "Locked" : "Create Invoice"}
            </Button>
          </PermissionGuard>
          
          <PermissionGuard permission="manage_work_orders">
            <Button
              onClick={() => workOrder.isLocked ? toast({
                title: "Action Blocked",
                description: "Cannot request parts - work order is locked due to paid invoice.",
                variant: "destructive"
              }) : setIsPartsRequestModalOpen(true)}
              className="flex items-center justify-center gap-2"
              disabled={workOrder.isLocked}
            >
              <Hammer className="h-4 w-4" />
              {workOrder.isLocked ? "Locked" : "Request Parts"}
            </Button>
          </PermissionGuard>
          
          <PermissionGuard permission="manage_work_orders">
            <Button
              onClick={() => workOrder.isLocked ? toast({
                title: "Action Blocked",
                description: "Cannot upload files - work order is locked due to paid invoice.",
                variant: "destructive"
              }) : setIsFileUploadModalOpen(true)}
              className="flex items-center justify-center gap-2"
              disabled={workOrder.isLocked}
            >
              <Upload className="h-4 w-4" />
              {workOrder.isLocked ? "Locked" : "Upload Files"}
            </Button>
          </PermissionGuard>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Proposal
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Invoice
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-1">
              <Hammer className="h-3 w-3" />
              Parts
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Files
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-gray-600">
                      {workOrder.street}<br />
                      {workOrder.city}, {workOrder.country}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Assigned to:</span>
                    {workOrder.assignedUsers && workOrder.assignedUsers.length > 0 ? (
                      <div className="space-y-1">
                        {workOrder.assignedUsers.map((user) => (
                          <div key={user.id}>
                            <p className="text-gray-600">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              ({user.email})
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No users assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Project Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Start Date:</span>
                    <p className="text-gray-600">{formatDate(workOrder.startDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium">End Date:</span>
                    <p className="text-gray-600">{formatDate(workOrder.endDate)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">NTE (without tax):</span>
                    <p className="text-gray-600">{formatCurrency(workOrder.nte)}</p>
                  </div>
                  <div>
                    <span className="font-medium">TNTE (including tax):</span>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(workOrder.tnte)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="proposal" className="space-y-4">
            {proposalData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Work Order Proposal</h3>
                  <PermissionGuard permission="workorders.edit">
                    <Button 
                      onClick={() => workOrder.isLocked ? toast({
                        title: "Action Blocked",
                        description: "Cannot edit proposals - work order is locked due to paid invoice.",
                        variant: "destructive"
                      }) : setIsProposalModalOpen(true)}
                      disabled={workOrder.isLocked}
                      variant="outline"
                      size="sm"
                    >
                      {workOrder.isLocked ? "Locked" : "Edit Proposal"}
                    </Button>
                  </PermissionGuard>
                </div>
                
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>Proposal Details</CardTitle>
                      <Badge variant={proposalData.status === "approved" ? "default" : 
                                   proposalData.status === "rejected" ? "destructive" : "secondary"}>
                        {proposalData.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      try {
                        const laborData = JSON.parse(proposalData.laborData || "[]");
                        const partsData = JSON.parse(proposalData.partsData || "[]");
                        const servicesData = JSON.parse(proposalData.servicesData || "[]");
                        
                        const laborTotal = laborData.reduce((sum: number, item: any) => {
                          const payRate = parseFloat(item.payRate || "0");
                          const regularHours = parseFloat(item.regularHours || "0");
                          const otHours = parseFloat(item.otHours || "0");
                          const otScale = parseFloat(item.otScale || "1.5");
                          return sum + (payRate * regularHours) + (payRate * otHours * otScale);
                        }, 0);
                        const partsTotal = partsData.reduce((sum: number, item: any) => sum + (parseFloat(item.unitCost || "0") * parseInt(item.quantity || "1")), 0);
                        const servicesTotal = servicesData.reduce((sum: number, item: any) => sum + (parseFloat(item.unitCost || "0") * parseInt(item.quantity || "1")), 0);
                        const grandTotal = laborTotal + partsTotal + servicesTotal;
                        
                        return (
                          <div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium text-sm text-gray-700">Labor Total</h4>
                                <p className="text-lg font-semibold text-blue-600">${laborTotal.toFixed(2)}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-gray-700">Parts Total</h4>
                                <p className="text-lg font-semibold text-green-600">${partsTotal.toFixed(2)}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-gray-700">Services Total</h4>
                                <p className="text-lg font-semibold text-purple-600">${servicesTotal.toFixed(2)}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-gray-700">Grand Total</h4>
                                <p className="text-xl font-bold text-gray-900">${grandTotal.toFixed(2)}</p>
                              </div>
                            </div>
                            
                            {/* Labor Table */}
                            {laborData.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">Labor Details</h4>
                                <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                                  {laborData.map((item: any, idx: number) => {
                                    const payRate = parseFloat(item.payRate || "0");
                                    const regularHours = parseFloat(item.regularHours || "0");
                                    const otHours = parseFloat(item.otHours || "0");
                                    const otScale = parseFloat(item.otScale || "1.5");
                                    const total = (payRate * regularHours) + (payRate * otHours * otScale);
                                    return (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.remark || `Labor ${idx + 1}`} ({regularHours}h reg + {otHours}h OT)</span>
                                        <span className="font-medium">${total.toFixed(2)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Parts Table */}
                            {partsData.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">Parts Details</h4>
                                <div className="bg-green-50 rounded-lg p-3 space-y-2">
                                  {partsData.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span>{item.remark || `Part ${idx + 1}`} (Qty: {item.quantity})</span>
                                      <span className="font-medium">${(parseFloat(item.unitCost || "0") * parseInt(item.quantity || "1")).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Services Table */}
                            {servicesData.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">Services Details</h4>
                                <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                                  {servicesData.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span>{item.remark || item.transactionType || `Service ${idx + 1}`} (Qty: {item.quantity || 1})</span>
                                      <span className="font-medium">${(parseFloat(item.unitCost || "0") * parseInt(item.quantity || "1")).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } catch {
                        return (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">Unable to parse proposal data</p>
                          </div>
                        );
                      }
                    })()}
                    
                    {proposalData.message && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Message</h4>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded border text-sm">{proposalData.message}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Created: {new Date(proposalData.createdAt).toLocaleDateString()}
                      {proposalData.updatedAt && proposalData.updatedAt !== proposalData.createdAt && (
                        <span> • Updated: {new Date(proposalData.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Hammer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Proposal Available</h3>
                <p className="text-gray-600 mb-4">
                  Request a proposal to be created for this work order. The proposal will be available for creation on the Proposals page.
                </p>
                <div className="space-x-2">
                  <Button 
                    onClick={() => {
                      toast({
                        title: "Proposal Request Sent",
                        description: "This work order has been added to the proposal requests queue. Check the Proposals page to create the proposal.",
                      });
                    }}
                    disabled={workOrder.isLocked}
                  >
                    {workOrder.isLocked ? "Locked" : "Request Proposal"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewProposalModalOpen(true)}>
                    View Proposal Details
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4">
            <InvoiceManagement 
              workOrder={workOrder}
              onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="parts" className="space-y-4">
            {partsRequests.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Parts Requests</h3>
                  <Button 
                    onClick={() => workOrder.isLocked ? toast({
                      title: "Action Blocked",
                      description: "Cannot request parts - work order is locked due to paid invoice.",
                      variant: "destructive"
                    }) : setIsPartsRequestModalOpen(true)}
                    disabled={workOrder.isLocked}
                    variant="outline"
                    size="sm"
                  >
                    {workOrder.isLocked ? "Locked" : "Add Parts Request"}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {partsRequests.map((request: any) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{request.partName}</h4>
                              <Badge variant={
                                request.status === "approved" ? "default" : 
                                request.status === "rejected" ? "destructive" : 
                                request.status === "ordered" ? "secondary" : "outline"
                              }>
                                {request.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>Status: {request.status}</div>
                              <div>Reason: {request.reason || "Not specified"}</div>
                              <div>Requested: {new Date(request.createdAt).toLocaleDateString()}</div>
                              {(() => {
                                try {
                                  const parts = JSON.parse(request.parts || "[]");
                                  return (
                                    <div className="mt-2">
                                      <div className="font-medium">Parts:</div>
                                      {parts.map((part: any, idx: number) => (
                                        <div key={idx} className="ml-2 text-xs">
                                          • {part.name} (Qty: {part.quantity}) - ${parseFloat(part.estimatedCost || "0").toFixed(2)} each
                                        </div>
                                      ))}
                                    </div>
                                  );
                                } catch {
                                  return null;
                                }
                              })()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-medium">
                              ${((parseFloat(request.estimatedCost || "0") * (request.quantity || 1)).toFixed(2))}
                            </div>
                            <div className="text-sm text-gray-500">Total Cost</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Parts Requested</h3>
                <p className="text-gray-600 mb-4">
                  Request parts and materials needed for this work order.
                </p>
                <div className="space-x-2">
                  <Button 
                    onClick={() => workOrder.isLocked ? toast({
                      title: "Action Blocked",
                      description: "Cannot request parts - work order is locked due to paid invoice.",
                      variant: "destructive"
                    }) : setIsPartsRequestModalOpen(true)}
                    disabled={workOrder.isLocked}
                  >
                    {workOrder.isLocked ? "Locked" : "Request Parts"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewPartsModalOpen(true)}>
                    View Parts Details
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">File Management</h3>
              <p className="text-gray-600 mb-4">
                Upload before/after photos, signatures, and documents.
              </p>
              <div className="space-x-2">
                <Button 
                  onClick={() => workOrder.isLocked ? toast({
                    title: "Action Blocked",
                    description: "Cannot upload files - work order is locked due to paid invoice.",
                    variant: "destructive"
                  }) : setIsFileUploadModalOpen(true)}
                  disabled={workOrder.isLocked}
                >
                  {workOrder.isLocked ? "Locked" : "Manage Files"}
                </Button>
                <Button variant="outline" onClick={() => setIsViewFilesModalOpen(true)}>
                  View Files Details
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Work Order Chat</h3>
              <p className="text-gray-600 mb-4">
                Communicate with team members about this work order.
              </p>
              <div className="space-x-2">
                <Button 
                  onClick={() => workOrder.isLocked ? toast({
                    title: "Action Blocked",
                    description: "Cannot access chat - work order is locked due to paid invoice.",
                    variant: "destructive"
                  }) : setIsChatModalOpen(true)}
                  disabled={workOrder.isLocked}
                >
                  {workOrder.isLocked ? "Locked" : "Open Chat"}
                </Button>
                <Button variant="outline" onClick={() => setIsViewChatModalOpen(true)}>
                  View Chat History
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Payment Requests</h3>
              <p className="text-gray-600 mb-6">
                Create payment requests for technicians working on this order.
              </p>
              
              <PermissionGuard permission="view_work_orders">
                <div className="space-x-2 mb-4">
                  <Button 
                    onClick={() => workOrder.isLocked ? toast({
                      title: "Action Blocked",
                      description: "Cannot create payment requests - work order is locked due to paid invoice.",
                      variant: "destructive"
                    }) : setIsPaymentRequestModalOpen(true)} 
                    disabled={workOrder.isLocked}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {workOrder.isLocked ? "Locked" : "Create Payment Request"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewPaymentModalOpen(true)}>
                    View Payment Details
                  </Button>
                </div>
              </PermissionGuard>



              {/* Existing Payment Requests */}
              {existingPayments.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Existing Payment Requests</h3>
                  <div className="space-y-3">
                    {existingPayments.map((payment: any) => {
                      const technician = technicians.find(t => t.id === payment.technicianId);
                      const paymentMethods = JSON.parse(payment.paymentMethod || "[]");
                      const requested = parseFloat(payment.amountRequested || "0");
                      const paid = parseFloat(payment.amountPaid || "0");
                      const remaining = Math.max(0, requested - paid);
                      
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case "paid": return "bg-green-100 text-green-800";
                          case "partially_paid": return "bg-yellow-100 text-yellow-800";
                          case "approved": return "bg-blue-100 text-blue-800";
                          case "rejected": return "bg-red-100 text-red-800";
                          default: return "bg-gray-100 text-gray-800";
                        }
                      };

                      return (
                        <Card key={payment.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {technician?.name || `Technician #${payment.technicianId}`}
                                </span>
                                <Badge className={getStatusColor(payment.status)}>
                                  {payment.status.replace("_", " ")}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                <div>Payment Methods: {paymentMethods.join(", ")}</div>
                                <div>Description: {payment.description || "No description"}</div>
                                <div>Requested: {new Date(payment.requestedAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-medium">${requested.toFixed(2)}</div>
                              {payment.amountPaid && (
                                <div className="text-sm text-gray-600">
                                  Paid: ${paid.toFixed(2)}
                                </div>
                              )}
                              {remaining > 0 && (
                                <div className="text-sm text-red-600">
                                  Remaining: ${remaining.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      {isProposalModalOpen && (
        <WorkOrderProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          workOrder={workOrder}
        />
      )}

      {isInvoiceModalOpen && (
        <CreateInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/invoice`] });
          }}
          workOrder={workOrder}
          onSubmit={(data) => {
            apiRequest("POST", `/api/work-orders/${workOrder.id}/invoice`, data)
              .then(() => {
                toast({
                  title: "Success",
                  description: "Invoice saved successfully",
                });
                setIsInvoiceModalOpen(false);
                queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/invoice`] });
              })
              .catch((error) => {
                toast({
                  title: "Error",
                  description: error.message || "Failed to save invoice",
                  variant: "destructive",
                });
              });
          }}
        />
      )}

      {isPartsRequestModalOpen && (
        <PartsRequestModal
          isOpen={isPartsRequestModalOpen}
          onClose={() => setIsPartsRequestModalOpen(false)}
          workOrder={workOrder}
        />
      )}

      {isFileUploadModalOpen && (
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onClose={() => setIsFileUploadModalOpen(false)}
          workOrder={workOrder}
        />
      )}

      {isChatModalOpen && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          workOrder={workOrder}
        />
      )}

      {isViewProposalModalOpen && (
        <Dialog open={isViewProposalModalOpen} onOpenChange={setIsViewProposalModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Proposal Details - {workOrder.workOrderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {proposalData ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>Work Order Proposal</CardTitle>
                      <Badge variant={proposalData.status === "approved" ? "default" : 
                                   proposalData.status === "rejected" ? "destructive" : "secondary"}>
                        {proposalData.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      try {
                        const laborData = JSON.parse(proposalData.laborData || "[]");
                        const partsData = JSON.parse(proposalData.partsData || "[]");
                        const servicesData = JSON.parse(proposalData.servicesData || "[]");
                        
                        const laborTotal = laborData.reduce((sum: number, item: any) => {
                          const payRate = parseFloat(item.payRate || "0");
                          const regularHours = parseFloat(item.regularHours || "0");
                          const otHours = parseFloat(item.otHours || "0");
                          const otScale = parseFloat(item.otScale || "1.5");
                          return sum + (payRate * regularHours) + (payRate * otHours * otScale);
                        }, 0);
                        const partsTotal = partsData.reduce((sum: number, item: any) => sum + (parseFloat(item.unitCost || "0") * parseInt(item.quantity || "1")), 0);
                        const servicesTotal = servicesData.reduce((sum: number, item: any) => sum + (parseFloat(item.unitCost || "0") * parseInt(item.quantity || "1")), 0);
                        const grandTotal = laborTotal + partsTotal + servicesTotal;
                        
                        return (
                          <div>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Labor Total</h4>
                                <p className="text-2xl font-bold text-blue-600">${laborTotal.toFixed(2)}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Parts Total</h4>
                                <p className="text-2xl font-bold text-green-600">${partsTotal.toFixed(2)}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Services Total</h4>
                                <p className="text-2xl font-bold text-purple-600">${servicesTotal.toFixed(2)}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Grand Total</h4>
                                <p className="text-3xl font-bold text-gray-900">${grandTotal.toFixed(2)}</p>
                              </div>
                            </div>
                            
                            {laborData.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-medium text-gray-700 mb-3">Labor Details</h4>
                                <div className="space-y-2">
                                  {laborData.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                      <div>
                                        <div className="font-medium">{item.description}</div>
                                        <div className="text-sm text-gray-600">{item.hours} hours × ${parseFloat(item.cost || "0").toFixed(2)}/hr</div>
                                      </div>
                                      <div className="font-bold">${(parseFloat(item.cost || "0") * parseFloat(item.hours || "1")).toFixed(2)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {partsData.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-medium text-gray-700 mb-3">Parts Details</h4>
                                <div className="space-y-2">
                                  {partsData.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                      <div>
                                        <div className="font-medium">{item.description}</div>
                                        <div className="text-sm text-gray-600">Qty: {item.quantity} × ${parseFloat(item.cost || "0").toFixed(2)} each</div>
                                      </div>
                                      <div className="font-bold">${(parseFloat(item.cost || "0") * parseInt(item.quantity || "1")).toFixed(2)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {servicesData.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-medium text-gray-700 mb-3">Services Details</h4>
                                <div className="space-y-2">
                                  {servicesData.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                      <div className="font-medium">{item.description}</div>
                                      <div className="font-bold">${parseFloat(item.cost || "0").toFixed(2)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } catch {
                        return (
                          <div className="text-center py-8">
                            <p className="text-gray-500">Unable to parse proposal data</p>
                          </div>
                        );
                      }
                    })()}
                    
                    {proposalData.message && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">Message</h4>
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <p className="text-gray-900 whitespace-pre-wrap">{proposalData.message}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Created: {new Date(proposalData.createdAt).toLocaleDateString()}</span>
                        {proposalData.updatedAt && proposalData.updatedAt !== proposalData.createdAt && (
                          <span>Updated: {new Date(proposalData.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <Hammer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Proposal Available</h3>
                  <p className="text-gray-600">No proposal has been created for this work order yet.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsViewProposalModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isViewPartsModalOpen && (
        <Dialog open={isViewPartsModalOpen} onOpenChange={setIsViewPartsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Parts Requests - {workOrder.workOrderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {partsRequests.length > 0 ? (
                <div className="space-y-3">
                  {partsRequests.map((request: any) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-xl font-bold text-gray-900">Parts Request #{request.id}</h4>
                              <Badge variant={
                                request.status === "approved" ? "default" : 
                                request.status === "rejected" ? "destructive" : 
                                request.status === "ordered" ? "secondary" : "outline"
                              }>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${((parseFloat(request.estimatedCost || "0") * (request.quantity || 1)).toFixed(2))}
                            </div>
                            <div className="text-sm text-gray-500">Total Cost</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-4">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Status</h5>
                            <p className="text-lg font-semibold capitalize">{request.status}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Requested By</h5>
                            <p className="text-lg">User #{request.requestedBy}</p>
                          </div>
                        </div>
                        
                        {request.notes && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-700 mb-2">Notes</h5>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <p className="text-gray-900">{request.notes}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Parts Details</h5>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{request.partName}</div>
                                <div className="text-sm text-gray-600">Quantity: {request.quantity}</div>
                                {request.partNumber && <div className="text-sm text-gray-600">Part Number: {request.partNumber}</div>}
                                {request.supplier && <div className="text-sm text-gray-600">Supplier: {request.supplier}</div>}
                                <div className="text-sm text-gray-600">Urgency: {request.urgency}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">${parseFloat(request.estimatedCost || "0").toFixed(2)}</div>
                                <div className="text-sm text-gray-500">per unit</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500 pt-3 border-t">
                          Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Parts Requests</h3>
                  <p className="text-gray-600">No parts have been requested for this work order yet.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsViewPartsModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isViewFilesModalOpen && (
        <Dialog open={isViewFilesModalOpen} onOpenChange={setIsViewFilesModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Files & Documents - {workOrder.workOrderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {workOrderFiles.length > 0 ? (
                <div className="space-y-4">
                  {['before', 'after', 'signature', 'document'].map(category => {
                    const categoryFiles = workOrderFiles.filter((file: any) => file.category === category);
                    if (categoryFiles.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-3">
                        <h4 className="text-lg font-semibold capitalize text-gray-800">
                          {category === 'before' ? 'Before Photos' : 
                           category === 'after' ? 'After Photos' :
                           category === 'signature' ? 'Signatures' : 'Documents'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryFiles.map((file: any) => (
                            <Card key={file.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    {file.fileType?.startsWith('image/') ? (
                                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-blue-600" />
                                      </div>
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-gray-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 truncate">{file.fileName}</h5>
                                    <p className="text-sm text-gray-500 mt-1">{file.fileType}</p>
                                    {file.description && (
                                      <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                      <span className="text-xs text-gray-500">
                                        {new Date(file.createdAt).toLocaleDateString()}
                                      </span>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => window.open(file.filePath, '_blank')}
                                      >
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Files Uploaded</h3>
                  <p className="text-gray-600">No files have been uploaded for this work order yet.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsViewFilesModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isViewChatModalOpen && (
        <Dialog open={isViewChatModalOpen} onOpenChange={setIsViewChatModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Chat History - {workOrder.workOrderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {workOrderChats.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {workOrderChats.map((chat: any) => (
                    <Card key={chat.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">User #{chat.userId}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(chat.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-gray-900 whitespace-pre-wrap">{chat.message}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Chat Messages</h3>
                  <p className="text-gray-600">No messages have been sent for this work order yet.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsViewChatModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isViewPaymentModalOpen && (
        <Dialog open={isViewPaymentModalOpen} onOpenChange={setIsViewPaymentModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Payment Requests - {workOrder.workOrderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {existingPayments.length > 0 ? (
                <div className="space-y-4">
                  {existingPayments.map((payment: any) => {
                    const technician = technicians.find(t => t.id === payment.technicianId);
                    const paymentMethods = JSON.parse(payment.paymentMethod || "[]");
                    const requested = parseFloat(payment.amountRequested || "0");
                    const paid = parseFloat(payment.amountPaid || "0");
                    const remaining = Math.max(0, requested - paid);
                    
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "paid": return "bg-green-100 text-green-800";
                        case "partially_paid": return "bg-yellow-100 text-yellow-800";
                        case "approved": return "bg-blue-100 text-blue-800";
                        case "rejected": return "bg-red-100 text-red-800";
                        default: return "bg-gray-100 text-gray-800";
                      }
                    };

                    return (
                      <Card key={payment.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-xl font-bold text-gray-900">
                                  {technician?.name || `Technician #${payment.technicianId}`}
                                </h4>
                                <Badge className={getStatusColor(payment.status)}>
                                  {payment.status.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">${requested.toFixed(2)}</div>
                              <div className="text-sm text-gray-500">Requested</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Payment Methods</h5>
                              <div className="flex flex-wrap gap-2">
                                {paymentMethods.map((method: string, idx: number) => (
                                  <Badge key={idx} variant="outline">{method}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Payment Status</h5>
                              {payment.amountPaid && (
                                <div className="space-y-1">
                                  <div className="text-sm text-gray-600">
                                    Paid: ${paid.toFixed(2)}
                                  </div>
                                  {remaining > 0 && (
                                    <div className="text-sm text-red-600">
                                      Remaining: ${remaining.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {payment.description && (
                            <div className="mb-4">
                              <h5 className="font-medium text-gray-700 mb-2">Description</h5>
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <p className="text-gray-900">{payment.description}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-500 pt-3 border-t">
                            <div className="flex justify-between">
                              <span>Requested: {new Date(payment.requestedAt).toLocaleDateString()}</span>
                              {payment.updatedAt && payment.updatedAt !== payment.requestedAt && (
                                <span>Updated: {new Date(payment.updatedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Payment Requests</h3>
                  <p className="text-gray-600">No payment requests have been created for this work order yet.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsViewPaymentModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Request Modal */}
      {isPaymentRequestModalOpen && (
        <PaymentRequestModal 
          isOpen={isPaymentRequestModalOpen}
          onClose={() => setIsPaymentRequestModalOpen(false)}
          workOrder={workOrder}
        />
      )}
    </Dialog>
  );
}