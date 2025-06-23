import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Edit, History, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PermissionGuard } from "@/components/rbac/permission-guard";

interface PaymentRequest {
  id: number;
  workOrderId: number;
  workOrderNumber: string;
  technicianId: number;
  technicianName: string;
  paymentMethod: string;
  amountRequested: string;
  amountApproved: string;
  amountPaid: string;
  status: string;
  description: string;
  requestedAt: string;
}

interface Technician {
  id: number;
  name: string;
  paymentMethods: string;
  paymentDetails: string;
}

export default function PaymentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  
  const [editForm, setEditForm] = useState({
    amountApproved: "",
    amountPaid: "",
    status: "",
    adminNotes: ""
  });

  const { data: payments = [], isLoading } = useQuery<PaymentRequest[]>({
    queryKey: ["/api/payments/all"],
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: technicianHistory = [] } = useQuery<PaymentRequest[]>({
    queryKey: [`/api/payments/technician/${selectedTechnicianId}`],
    enabled: !!selectedTechnicianId,
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (data: { id: number; updates: any }) =>
      apiRequest("PATCH", `/api/payments/${data.id}`, data.updates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/all"] });
      setIsEditModalOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "partially_paid":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateRemaining = (requested: string, paid: string) => {
    const requestedAmount = parseFloat(requested) || 0;
    const paidAmount = parseFloat(paid) || 0;
    return Math.max(0, requestedAmount - paidAmount);
  };

  const handleEditPayment = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setEditForm({
      amountApproved: payment.amountApproved || "",
      amountPaid: payment.amountPaid || "",
      status: payment.status,
      adminNotes: ""
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePayment = () => {
    if (!selectedPayment) return;
    
    updatePaymentMutation.mutate({
      id: selectedPayment.id,
      updates: editForm
    });
  };

  const handleViewHistory = (technicianId: number) => {
    setSelectedTechnicianId(technicianId);
    setIsHistoryModalOpen(true);
  };

  const getPaymentMethods = (technician: Technician) => {
    try {
      return JSON.parse(technician.paymentMethods || "[]");
    } catch {
      return [];
    }
  };

  const getPaymentDetails = (technician: Technician) => {
    try {
      return JSON.parse(technician.paymentDetails || "{}");
    } catch {
      return {};
    }
  };

  const formatPaymentMethod = (method: string) => {
    const methodLabels: { [key: string]: string } = {
      paypal: "PayPal",
      credit_card: "Credit/Debit Cards",
      bank_transfer: "Bank Transfer",
      digital_wallet: "Digital Wallets",
      cryptocurrency: "Cryptocurrency",
      cash: "Cash Payment",
      venmo: "Venmo",
      cashapp: "Cash App",
      zelle: "Zelle",
      check: "Check Payment",
      financing: "Financing Options"
    };
    return methodLabels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodIcons: { [key: string]: string } = {
      paypal: "💳",
      credit_card: "💎",
      bank_transfer: "🏦",
      digital_wallet: "📱",
      cryptocurrency: "₿",
      cash: "💵",
      venmo: "📲",
      cashapp: "💸",
      zelle: "⚡",
      check: "📝",
      financing: "📊"
    };
    return methodIcons[method] || "💳";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Manager</h1>
          <p className="text-gray-600">Manage technician payment requests and approvals</p>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">{payments.length} payment requests</span>
        </div>
      </div>

      <PermissionGuard permission="manage_work_orders">
        <Card>
          <CardHeader>
            <CardTitle>Payment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const technician = technicians.find(t => t.id === payment.technicianId);
                  const paymentMethods = technician ? getPaymentMethods(technician) : [];
                  const remaining = calculateRemaining(payment.amountRequested, payment.amountPaid);
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.workOrderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.technicianName}</div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => handleViewHistory(payment.technicianId)}
                          >
                            <History className="h-3 w-3 mr-1" />
                            View History
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const technician = technicians.find(t => t.id === payment.technicianId);
                          if (!technician) return <Badge variant="outline">{payment.paymentMethod}</Badge>;
                          
                          const methods = getPaymentMethods(technician);
                          if (methods.length === 0) return <Badge variant="outline">No methods configured</Badge>;
                          
                          return (
                            <div className="flex flex-wrap gap-1">
                              {methods.slice(0, 2).map((method: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {getPaymentMethodIcon(method)} {formatPaymentMethod(method)}
                                </Badge>
                              ))}
                              {methods.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{methods.length - 2} more
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>${parseFloat(payment.amountRequested).toFixed(2)}</TableCell>
                      <TableCell>
                        {payment.amountApproved ? `$${parseFloat(payment.amountApproved).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>
                        {payment.amountPaid ? `$${parseFloat(payment.amountPaid).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={remaining > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                          ${remaining.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(payment.status)}
                            <span className="capitalize">{payment.status.replace("_", " ")}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No payment requests found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* Edit Payment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Request</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Work Order: {selectedPayment.workOrderNumber}</Label>
                <Label>Technician: {selectedPayment.technicianName}</Label>
                <Label>Requested: ${parseFloat(selectedPayment.amountRequested).toFixed(2)}</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountApproved">Amount Approved</Label>
                <Input
                  id="amountApproved"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editForm.amountApproved}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amountApproved: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editForm.amountPaid}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add notes about this payment..."
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdatePayment}
                  disabled={updatePaymentMutation.isPending}
                >
                  {updatePaymentMutation.isPending ? "Updating..." : "Update Payment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Technician Payment History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Technician Payment History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicianHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{payment.workOrderNumber}</TableCell>
                    <TableCell>${parseFloat(payment.amountRequested).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {JSON.parse(payment.paymentMethod || "[]").join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
                {technicianHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No payment history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}