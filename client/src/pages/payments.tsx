import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { 
  DollarSign, 
  User, 
  Calendar, 
  Search, 
  Filter,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import type { WorkOrderTechnicianPayment, Technician, WorkOrder } from "@shared/schema";

export default function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<WorkOrderTechnicianPayment | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    amountApproved: "",
    amountPaid: ""
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

  const updatePaymentMutation = useMutation({
    mutationFn: (data: { id: number; updateData: any }) => 
      apiRequest("PATCH", `/api/payments/${data.id}`, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment request updated successfully",
      });
      setIsUpdateModalOpen(false);
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

  const getTechnicianDetails = (technicianId: number) => {
    const technician = technicians.find(t => t.id === technicianId);
    if (!technician) return { name: "Unknown Technician", rating: "No ratings" };
    return {
      name: `${technician.firstName} ${technician.lastName}`,
      rating: technician.averageRating ? technician.averageRating.toFixed(1) : 'No ratings'
    };
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

  const handleUpdatePayment = () => {
    if (!selectedPayment) return;

    updatePaymentMutation.mutate({
      id: selectedPayment.id,
      updateData: {
        status: updateData.status || selectedPayment.status,
        amountApproved: updateData.amountApproved || selectedPayment.amountApproved,
        amountPaid: updateData.amountPaid || selectedPayment.amountPaid,
      }
    });
  };

  const openUpdateModal = (payment: WorkOrderTechnicianPayment) => {
    setSelectedPayment(payment);
    setUpdateData({
      status: payment.status,
      amountApproved: payment.amountApproved || "0",
      amountPaid: payment.amountPaid || "0"
    });
    setIsUpdateModalOpen(true);
  };

  const getTotalStats = () => {
    const totalRequested = payments.reduce((sum, p) => sum + parseFloat(p.amountRequested), 0);
    const totalApproved = payments.reduce((sum, p) => sum + parseFloat(p.amountApproved || "0"), 0);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amountPaid || "0"), 0);
    
    return { totalRequested, totalApproved, totalPaid };
  };

  const stats = getTotalStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Requests</h1>
          <p className="text-gray-600 mt-1">Manage technician payment requests across all work orders</p>
        </div>
        <PermissionGuard permission="manage_work_orders">
          <Button onClick={() => window.location.href = '/work-orders'}>
            <DollarSign className="h-4 w-4 mr-2" />
            Create New Request
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalPaid.toString())}
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
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payment requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Technician</TableHead>
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
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <p className="font-medium">{getTechnicianDetails(payment.technicianId).name}</p>
                          <p className="text-xs text-gray-500">⭐ {getTechnicianDetails(payment.technicianId).rating}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
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
                      <PermissionGuard permission="manage_work_orders">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUpdateModal(payment)}
                        >
                          Update
                        </Button>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Payment Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Payment Request</DialogTitle>
            <DialogDescription>
              Update the status and amounts for this payment request.
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
                  <p>{getTechnicianDetails(selectedPayment.technicianId).name}</p>
                  <p className="text-sm text-gray-500">⭐ {getTechnicianDetails(selectedPayment.technicianId).rating} rating</p>
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

              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={updateData.status} onValueChange={(value) => 
                    setUpdateData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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

                <div>
                  <Label htmlFor="amountApproved">Amount Approved</Label>
                  <Input
                    id="amountApproved"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={updateData.amountApproved}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, amountApproved: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="amountPaid">Amount Paid</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={updateData.amountPaid}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, amountPaid: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdatePayment}
                  disabled={updatePaymentMutation.isPending}
                >
                  {updatePaymentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Update Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}