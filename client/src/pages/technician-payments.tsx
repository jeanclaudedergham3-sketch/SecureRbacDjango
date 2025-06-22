import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  DollarSign, 
  Calendar, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import type { WorkOrderTechnicianPayment, WorkOrder, Technician } from "@shared/schema";

export default function TechnicianPaymentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<WorkOrderTechnicianPayment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Get current user's technician ID
  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const currentTechnician = technicians.find(t => 
    t.firstName === user?.firstName && t.lastName === user?.lastName
  );

  // Fetch payment requests for current technician
  const { data: allPayments = [], isLoading } = useQuery<WorkOrderTechnicianPayment[]>({
    queryKey: ["/api/payments"],
  });

  const technicianPayments = allPayments.filter(payment => 
    currentTechnician ? payment.technicianId === currentTechnician.id : false
  );

  // Fetch work orders for reference
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: (data: { id: number; reason: string }) => 
      apiRequest("PATCH", `/api/payments/${data.id}`, { 
        status: "cancelled",
        description: `Payment cancelled by technician. Reason: ${data.reason}`
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment request cancelled successfully",
      });
      setIsCancelModalOpen(false);
      setSelectedPayment(null);
      setCancelReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel payment request",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "partially_paid": return "bg-blue-100 text-blue-800";
      case "paid": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "partially_paid": return <AlertTriangle className="h-4 w-4" />;
      case "paid": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount || "0"));
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

  const getWorkOrderNumber = (workOrderId: number) => {
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    return workOrder ? workOrder.workOrderNumber : "Unknown";
  };

  const filteredPayments = technicianPayments.filter(payment => {
    const matchesSearch = getWorkOrderNumber(payment.workOrderId)
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      (payment.description && payment.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCancelPayment = () => {
    if (!selectedPayment || !cancelReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    cancelPaymentMutation.mutate({
      id: selectedPayment.id,
      reason: cancelReason
    });
  };

  const openCancelModal = (payment: WorkOrderTechnicianPayment) => {
    setSelectedPayment(payment);
    setIsCancelModalOpen(true);
  };

  const openDetailsModal = (payment: WorkOrderTechnicianPayment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  const getTotalStats = () => {
    const totalRequested = technicianPayments.reduce((sum, p) => sum + parseFloat(p.amountRequested), 0);
    const totalApproved = technicianPayments.reduce((sum, p) => sum + parseFloat(p.amountApproved || "0"), 0);
    const totalPaid = technicianPayments.reduce((sum, p) => sum + parseFloat(p.amountPaid || "0"), 0);
    const pendingCount = technicianPayments.filter(p => p.status === "pending").length;
    
    return { totalRequested, totalApproved, totalPaid, pendingCount };
  };

  const stats = getTotalStats();

  if (!currentTechnician) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              This page is only accessible to registered technicians. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Payment Requests</h1>
          <p className="text-gray-600 mt-1">Track your payment requests and earnings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requested</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.totalRequested.toString())}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalApproved.toString())}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalPaid.toString())}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by work order or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payment requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {getWorkOrderNumber(payment.workOrderId)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="font-medium text-yellow-600">
                      {formatCurrency(payment.amountRequested)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(payment.amountApproved || "0")}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {formatCurrency(payment.amountPaid || "0")}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          {payment.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(payment.requestedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailsModal(payment)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {payment.status === "pending" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openCancelModal(payment)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Request Details</DialogTitle>
            <DialogDescription>
              View complete details of your payment request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Work Order:</span>
                  <p>{getWorkOrderNumber(selectedPayment.workOrderId)}</p>
                </div>
                <div>
                  <span className="font-medium">Payment Method:</span>
                  <p className="capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium">Request Date:</span>
                  <p>{formatDate(selectedPayment.requestedAt)}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(selectedPayment.status)}>
                    {selectedPayment.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Requested:</span>
                  <p className="text-lg font-semibold text-yellow-600">
                    {formatCurrency(selectedPayment.amountRequested)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Approved:</span>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedPayment.amountApproved || "0")}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Paid:</span>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(selectedPayment.amountPaid || "0")}
                  </p>
                </div>
              </div>

              {selectedPayment.description && (
                <div>
                  <span className="font-medium">Description/Notes:</span>
                  <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                    {selectedPayment.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsDetailsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Payment Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cancel Payment Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this payment request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Work Order:</span>
                  <span>{getWorkOrderNumber(selectedPayment.workOrderId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Amount:</span>
                  <span className="text-lg font-semibold text-yellow-600">
                    {formatCurrency(selectedPayment.amountRequested)}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Please explain why you're cancelling this payment request..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelReason("");
                }}>
                  Keep Request
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCancelPayment}
                  disabled={cancelPaymentMutation.isPending || !cancelReason.trim()}
                >
                  {cancelPaymentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Cancel Payment Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}