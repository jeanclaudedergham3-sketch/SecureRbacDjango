import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, CreditCard, User, Clock } from "lucide-react";
import type { WorkOrderWithUsers, Technician, WorkOrderTechnicianPayment } from "@shared/schema";

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers;
}

export function PaymentRequestModal({ isOpen, onClose, workOrder }: PaymentRequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountRequested, setAmountRequested] = useState("");
  const [description, setDescription] = useState("");

  // Fetch technicians
  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
    enabled: isOpen,
  });

  // Fetch existing payment requests for this work order
  const { data: paymentRequests = [], isLoading } = useQuery<WorkOrderTechnicianPayment[]>({
    queryKey: [`/api/work-orders/${workOrder.id}/payments`],
    enabled: isOpen,
  });

  const createPaymentRequestMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", `/api/work-orders/${workOrder.id}/payments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/payments`] });
      toast({
        title: "Success",
        description: "Payment request created successfully",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedTechnicianId("");
    setPaymentMethod("");
    setAmountRequested("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTechnicianId || !paymentMethod || !amountRequested) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      workOrderId: workOrder.id,
      technicianId: parseInt(selectedTechnicianId),
      paymentMethod,
      amountRequested,
      description: description || `Payment request for work order ${workOrder.workOrderNumber}`,
    };

    createPaymentRequestMutation.mutate(paymentData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "partially_paid": return "bg-blue-100 text-blue-800";
      case "paid": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTechnicianName = (technicianId: number) => {
    const technician = technicians.find(t => t.id === technicianId);
    return technician ? `${technician.firstName} ${technician.lastName}` : "Unknown Technician";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Payment Requests - {workOrder.workOrderNumber}
          </DialogTitle>
          <DialogDescription>
            Create and manage payment requests for technicians on this work order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Payment Request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Payment Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="technician">Technician *</Label>
                    <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id.toString()}>
                            {technician.firstName} {technician.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Amount Requested *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountRequested}
                    onChange={(e) => setAmountRequested(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Payment description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={createPaymentRequestMutation.isPending}
                  className="w-full"
                >
                  {createPaymentRequestMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Create Payment Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Payment Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Existing Payment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : paymentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No payment requests found for this work order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentRequests.map((payment) => (
                    <div key={payment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{getTechnicianName(payment.technicianId)}</p>
                            <p className="text-sm text-gray-500">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Requested:</span>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(payment.amountRequested)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Approved:</span>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatCurrency(payment.amountApproved || "0")}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Paid:</span>
                          <p className="text-lg font-semibold text-purple-600">
                            {formatCurrency(payment.amountPaid || "0")}
                          </p>
                        </div>
                      </div>

                      {payment.requestedAt && (
                        <div className="flex items-center mt-3 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Requested on {formatDate(payment.requestedAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}