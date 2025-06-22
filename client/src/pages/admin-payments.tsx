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
import { apiRequest } from "@/lib/queryClient";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { CreatePaymentRequestModal } from "@/components/modals/create-payment-request-modal";
import { 
  DollarSign, 
  User, 
  Calendar, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Eye
} from "lucide-react";
import type { WorkOrderTechnicianPayment, Technician, WorkOrder } from "@shared/schema";

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<WorkOrderTechnicianPayment | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: "",
    amountApproved: "",
    adminNotes: ""
  });

  // Fetch all payment requests
  const { data: payments = [], isLoading } = useQuery<WorkOrderTechnicianPayment[]>({
    queryKey: ["/api/payments"],
  });

  // Fetch technicians for name lookup
  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  // Fetch work orders for work order lookup
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const approvePaymentMutation = useMutation({
    mutationFn: (data: { id: number; updateData: any }) => 
      apiRequest("PATCH", `/api/payments/${data.id}`, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment request updated successfully",
      });
      setIsApprovalModalOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment request",
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

  const getTechnicianName = (technicianId: number) => {
    const technician = technicians.find(t => t.id === technicianId);
    return technician ? `${technician.firstName} ${technician.lastName}` : "Unknown Technician";
  };

  const getWorkOrderNumber = (workOrderId: number) => {
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    return workOrder ? workOrder.workOrderNumber : "Unknown";
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = getTechnicianName(payment.technicianId)
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      getWorkOrderNumber(payment.workOrderId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprovePayment = () => {
    if (!selectedPayment) return;

    const updateData: any = {
      status: approvalData.status || selectedPayment.status,
    };

    if (approvalData.amountApproved) {
      updateData.amountApproved = approvalData.amountApproved;
    }

    if (approvalData.adminNotes) {
      updateData.description = selectedPayment.description 
        ? `${selectedPayment.description}\n\nAdmin Notes: ${approvalData.adminNotes}`
        : `Admin Notes: ${approvalData.adminNotes}`;
    }

    approvePaymentMutation.mutate({
      id: selectedPayment.id,
      updateData
    });
  };

  const openApprovalModal = (payment: WorkOrderTechnicianPayment) => {
    setSelectedPayment(payment);
    setApprovalData({
      status: payment.status,
      amountApproved: payment.amountApproved || payment.amountRequested,
      adminNotes: ""
    });
    setIsApprovalModalOpen(true);
  };

  const getTotalStats = () => {
    const totalRequested = payments.reduce((sum, p) => sum + parseFloat(p.amountRequested), 0);
    const totalApproved = payments.reduce((sum, p) => sum + parseFloat(p.amountApproved || "0"), 0);
    const pendingCount = payments.filter(p => p.status === "pending").length;
    const approvedCount = payments.filter(p => p.status === "approved" || p.status === "paid").length;
    
    return { totalRequested, totalApproved, pendingCount, approvedCount };
  };

  const stats = getTotalStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Administration</h1>
          <p className="text-gray-600 mt-1">Review and approve technician payment requests</p>
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
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.approvedCount}
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
                  placeholder="Search by technician name or work order..."
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
                  <TableHead>Technician</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Approved</TableHead>
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
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {getTechnicianName(payment.technicianId)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-yellow-600">
                      {formatCurrency(payment.amountRequested)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(payment.amountApproved || "0")}
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
                      <PermissionGuard permission="manage_work_orders">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openApprovalModal(payment)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </div>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Payment Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject this payment request.
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
                  <span className="font-medium">Technician:</span>
                  <p>{getTechnicianName(selectedPayment.technicianId)}</p>
                </div>
                <div>
                  <span className="font-medium">Payment Method:</span>
                  <p className="capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium">Amount Requested:</span>
                  <p className="text-lg font-semibold text-yellow-600">
                    {formatCurrency(selectedPayment.amountRequested)}
                  </p>
                </div>
              </div>

              {selectedPayment.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedPayment.description}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={approvalData.status} onValueChange={(value) => 
                    setApprovalData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amountApproved">Amount Approved</Label>
                  <Input
                    id="amountApproved"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={approvalData.amountApproved}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, amountApproved: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about this approval decision..."
                    value={approvalData.adminNotes}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApprovePayment}
                  disabled={approvePaymentMutation.isPending}
                >
                  {approvePaymentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Update Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Payment Request Modal */}
      <CreatePaymentRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}