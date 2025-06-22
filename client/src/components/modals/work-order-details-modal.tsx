import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, User, FileText, MessageSquare, CreditCard, Receipt, Upload, Hammer, DollarSign, Plus } from "lucide-react";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { WorkOrderProposalModal } from "@/components/modals/work-order-proposal-modal";
import { PartsRequestModal } from "@/components/modals/parts-request-modal";
import { FileUploadModal } from "@/components/modals/file-upload-modal";
import { ChatModal } from "@/components/modals/chat-modal";
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
  const [isPartsRequestModalOpen, setIsPartsRequestModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isPaymentRequestOpen, setIsPaymentRequestOpen] = useState(false);

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: existingPayments = [] } = useQuery({
    queryKey: ["/api/work-orders", workOrder?.id, "payments"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrder.id, "payments"] });
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex items-center gap-1">
              <Hammer className="h-3 w-3" />
              Proposal
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />
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
            <TabsTrigger value="payments" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Payments
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
            <div className="text-center py-8">
              <Hammer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Proposal Management</h3>
              <p className="text-gray-600 mb-4">
                Create and manage labor, parts, and services proposals for this work order.
              </p>
              <PermissionGuard permission="manage_work_orders">
                <div className="space-x-2">
                  <Button onClick={() => setIsProposalModalOpen(true)}>
                    Create/Edit Proposal
                  </Button>
                  <Button variant="outline" onClick={() => {
                    onClose();
                    window.location.href = '/proposals';
                  }}>
                    View All Proposals
                  </Button>
                </div>
              </PermissionGuard>
            </div>
          </TabsContent>

          <TabsContent value="parts" className="space-y-4">
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Parts Requests</h3>
              <p className="text-gray-600 mb-4">
                Request parts and materials for this work order.
              </p>
              <div className="space-x-2">
                <Button onClick={() => setIsPartsRequestModalOpen(true)}>
                  Request Parts
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/parts-requests'}>
                  View All Parts Requests
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">File Management</h3>
              <p className="text-gray-600 mb-4">
                Upload before/after photos, signatures, and documents.
              </p>
              <Button onClick={() => setIsFileUploadModalOpen(true)}>
                Manage Files
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Work Order Chat</h3>
              <p className="text-gray-600 mb-4">
                Communicate with team members about this work order.
              </p>
              <Button onClick={() => setIsChatModalOpen(true)}>
                Open Chat
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Payment Requests</h3>
              <p className="text-gray-600 mb-6">
                Create payment requests for technicians working on this order.
              </p>
              
              <PermissionGuard permission="view_work_orders">
                <Button onClick={() => setIsPaymentRequestOpen(true)} className="mb-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment Request
                </Button>
              </PermissionGuard>

              {isPaymentRequestOpen && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>New Payment Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...paymentForm}>
                      <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
                        {/* Technician Selection */}
                        <FormField
                          control={paymentForm.control}
                          name="technicianId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Technician</FormLabel>
                              <Select onValueChange={handleTechnicianChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select technician" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {technicians.map((technician) => (
                                    <SelectItem key={technician.id} value={technician.id.toString()}>
                                      <div className="flex items-center space-x-2">
                                        <span>
                                          {technician.firstName && technician.lastName 
                                            ? `${technician.firstName} ${technician.lastName}`
                                            : technician.name || `Technician #${technician.id}`
                                          }
                                        </span>
                                        {technician.averageRating && (
                                          <span className="text-sm text-gray-500">⭐ {technician.averageRating}</span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Payment Methods - Only show when technician is selected */}
                        {selectedTechnician && (
                          <FormField
                            control={paymentForm.control}
                            name="paymentMethods"
                            render={() => (
                              <FormItem>
                                <FormLabel>Available Payment Methods</FormLabel>
                                <div className="space-y-3">
                                  {getAvailablePaymentMethods(selectedTechnician).map((method: string) => {
                                    const methodInfo = paymentMethodsInfo[method as keyof typeof paymentMethodsInfo];
                                    const technicianDetails = getPaymentDetails(selectedTechnician);
                                    const isSelected = selectedPaymentMethods.includes(method);
                                    
                                    return (
                                      <div key={method} className="border rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Checkbox
                                            id={method}
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handlePaymentMethodToggle(method, checked as boolean)}
                                          />
                                          <label htmlFor={method} className="flex items-center space-x-2 cursor-pointer">
                                            <span className="text-lg">{methodInfo?.icon}</span>
                                            <div>
                                              <div className="font-medium">{methodInfo?.name}</div>
                                              <div className="text-sm text-gray-500">{methodInfo?.description}</div>
                                            </div>
                                          </label>
                                        </div>
                                        
                                        {isSelected && methodInfo && (
                                          <div className="ml-6 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="font-medium mb-2 text-blue-800">Payment Details:</div>
                                            <div className="space-y-2">
                                              {methodInfo.details.map((detail, idx) => {
                                                const value = technicianDetails[method]?.[detail];
                                                if (!value) return null;
                                                
                                                return (
                                                  <div key={idx} className="flex flex-col space-y-1">
                                                    <div className="text-xs font-medium text-gray-700">{detail}:</div>
                                                    <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                                                      {detail === "PayPal Link" || detail === "Venmo" || detail === "CashApp" ? (
                                                        <a 
                                                          href={detail === "PayPal Link" ? value : `#`} 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="text-blue-600 hover:underline font-mono text-sm"
                                                        >
                                                          {value}
                                                        </a>
                                                      ) : detail === "QR Code" ? (
                                                        <div className="flex items-center space-x-2">
                                                          <span className="text-sm">QR Code Available</span>
                                                          <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-xs">QR</div>
                                                        </div>
                                                      ) : (
                                                        <span className="font-mono text-sm">{value}</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Amount */}
                        <FormField
                          control={paymentForm.control}
                          name="amountRequested"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount Requested</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Description */}
                        <FormField
                          control={paymentForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes..."
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsPaymentRequestOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createPaymentMutation.isPending}
                          >
                            {createPaymentMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : null}
                            Send Payment Request
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

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


    </Dialog>
  );
}