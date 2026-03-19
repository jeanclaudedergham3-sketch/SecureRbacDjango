import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  DollarSign, Edit, History, CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, Wallet, ListChecks, Search, ThumbsUp, CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AdvancedPermissionGuard, PageGuard } from "@/components/rbac/advanced-permission-guard";

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
  adminNotes?: string;
  priority?: string;
  dueDate?: string;
}

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  paymentMethods: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  pending: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  approved: {
    label: "Approved",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
  },
  partially_paid: {
    label: "Partially Paid",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  paid: {
    label: "Fully Paid",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Badge className={`flex items-center gap-1 border text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function fmt(val: string | undefined | null) {
  const n = parseFloat(val || "0");
  return isNaN(n) ? "$0.00" : `$${n.toFixed(2)}`;
}

export default function PaymentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialNotes, setPartialNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTechnician, setFilterTechnician] = useState("all");

  const [editForm, setEditForm] = useState({
    amountApproved: "",
    amountPaid: "",
    status: "",
    adminNotes: "",
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
      queryClient.invalidateQueries({ queryKey: ["/api/payments/all"] });
      setIsEditModalOpen(false);
      setIsPartialModalOpen(false);
      setSelectedPayment(null);
      toast({ title: "Payment updated", description: "Status saved successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update payment", variant: "destructive" });
    },
  });

  const markAs = (payment: PaymentRequest, status: string, extra?: Partial<typeof editForm>) => {
    const base: any = { status };
    if (status === "paid") {
      base.amountApproved = payment.amountRequested;
      base.amountPaid = payment.amountRequested;
    }
    if (status === "approved") {
      base.amountApproved = payment.amountRequested;
    }
    updatePaymentMutation.mutate({ id: payment.id, updates: { ...base, ...extra } });
  };

  const handlePartialSubmit = () => {
    if (!selectedPayment || !partialAmount) return;
    const amt = parseFloat(partialAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid positive number.", variant: "destructive" });
      return;
    }
    updatePaymentMutation.mutate({
      id: selectedPayment.id,
      updates: {
        status: "partially_paid",
        amountApproved: selectedPayment.amountRequested,
        amountPaid: partialAmount,
        adminNotes: partialNotes || undefined,
      },
    });
  };

  const openPartialModal = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setPartialAmount(payment.amountPaid || "");
    setPartialNotes(payment.adminNotes || "");
    setIsPartialModalOpen(true);
  };

  const handleEditPayment = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setEditForm({
      amountApproved: payment.amountApproved || "",
      amountPaid: payment.amountPaid || "",
      status: payment.status,
      adminNotes: payment.adminNotes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePayment = () => {
    if (!selectedPayment) return;
    updatePaymentMutation.mutate({ id: selectedPayment.id, updates: editForm });
  };

  const handleViewHistory = (technicianId: number) => {
    setSelectedTechnicianId(technicianId);
    setIsHistoryModalOpen(true);
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.technicianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchTech = filterTechnician === "all" || p.technicianId.toString() === filterTechnician;
      return matchSearch && matchStatus && matchTech;
    });
  }, [payments, searchTerm, filterStatus, filterTechnician]);

  const totals = useMemo(() => {
    const all = payments;
    return {
      totalRequested: all.reduce((s, p) => s + (parseFloat(p.amountRequested) || 0), 0),
      totalApproved: all.reduce((s, p) => s + (parseFloat(p.amountApproved) || 0), 0),
      totalPaid: all.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0),
      totalRemaining: all.reduce((s, p) => s + Math.max(0, (parseFloat(p.amountRequested) || 0) - (parseFloat(p.amountPaid) || 0)), 0),
      countPending: all.filter((p) => p.status === "pending").length,
      countApproved: all.filter((p) => p.status === "approved").length,
      countPartial: all.filter((p) => p.status === "partially_paid").length,
      countPaid: all.filter((p) => p.status === "paid").length,
      countRejected: all.filter((p) => p.status === "rejected").length,
    };
  }, [payments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PageGuard pageName="payments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Manager</h1>
            <p className="text-muted-foreground">Approve, track, and manage all technician payment requests</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {payments.length} total requests
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Requested</p>
                  <p className="text-2xl font-bold text-blue-600">${totals.totalRequested.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{payments.length} requests</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">${totals.totalPaid.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{totals.countPaid} fully paid + {totals.countPartial} partial</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Remaining Balance</p>
                  <p className="text-2xl font-bold text-amber-600">${totals.totalRemaining.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{totals.countPending} pending approval</p>
                </div>
                <Wallet className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Approved (Unpaid)</p>
                  <p className="text-2xl font-bold text-purple-600">${(totals.totalApproved - totals.totalPaid).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{totals.countApproved} approved requests</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status breakdown strip */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: `All (${payments.length})`, color: "bg-slate-100 text-slate-700" },
            { key: "pending", label: `Pending (${totals.countPending})`, color: "bg-gray-100 text-gray-700" },
            { key: "approved", label: `Approved (${totals.countApproved})`, color: "bg-blue-100 text-blue-700" },
            { key: "partially_paid", label: `Partially Paid (${totals.countPartial})`, color: "bg-amber-100 text-amber-700" },
            { key: "paid", label: `Fully Paid (${totals.countPaid})`, color: "bg-green-100 text-green-700" },
            { key: "rejected", label: `Rejected (${totals.countRejected})`, color: "bg-red-100 text-red-700" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filterStatus === f.key ? "ring-2 ring-offset-1 ring-slate-400 " : ""
              }${f.color}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by work order, technician, or description..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterTechnician} onValueChange={setFilterTechnician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Technicians" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.firstName} {t.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Table */}
        <AdvancedPermissionGuard permission="payments.view">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4" />
                Payment Requests
                {filteredPayments.length !== payments.length && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({filteredPayments.length} of {payments.length} shown)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-4">Work Order</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Requested</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Quick Actions</TableHead>
                      <TableHead>Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const requested = parseFloat(payment.amountRequested) || 0;
                      const paid = parseFloat(payment.amountPaid) || 0;
                      const remaining = Math.max(0, requested - paid);
                      const isPending = updatePaymentMutation.isPending;

                      return (
                        <TableRow key={payment.id} className="hover:bg-muted/20">
                          <TableCell className="pl-4 font-medium text-blue-700">
                            {payment.workOrderNumber}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{payment.technicianName}</div>
                            <button
                              onClick={() => handleViewHistory(payment.technicianId)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <History className="h-3 w-3" /> History
                            </button>
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                            {payment.description || "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {fmt(payment.amountRequested)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={paid > 0 ? "text-green-700 font-medium" : "text-muted-foreground"}>
                              {paid > 0 ? fmt(payment.amountPaid) : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={remaining > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                              {remaining > 0 ? `$${remaining.toFixed(2)}` : "$0.00"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(payment.requestedAt).toLocaleDateString()}
                          </TableCell>
                          {/* Quick action buttons */}
                          <TableCell>
                            <div className="flex items-center gap-1 justify-center flex-wrap">
                              {payment.status !== "paid" && (
                                <button
                                  title="Mark as Fully Paid"
                                  disabled={isPending}
                                  onClick={() => markAs(payment, "paid")}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium border border-green-300 disabled:opacity-50 transition-colors"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Paid
                                </button>
                              )}
                              {payment.status !== "partially_paid" && payment.status !== "paid" && (
                                <button
                                  title="Mark as Partially Paid"
                                  disabled={isPending}
                                  onClick={() => openPartialModal(payment)}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-medium border border-amber-300 disabled:opacity-50 transition-colors"
                                >
                                  <AlertCircle className="h-3.5 w-3.5" /> Partial
                                </button>
                              )}
                              {payment.status === "partially_paid" && (
                                <button
                                  title="Update Partial Amount"
                                  disabled={isPending}
                                  onClick={() => openPartialModal(payment)}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-medium border border-amber-300 disabled:opacity-50 transition-colors"
                                >
                                  <AlertCircle className="h-3.5 w-3.5" /> Update
                                </button>
                              )}
                              {payment.status !== "approved" && payment.status !== "paid" && payment.status !== "rejected" && (
                                <button
                                  title="Approve"
                                  disabled={isPending}
                                  onClick={() => markAs(payment, "approved")}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium border border-blue-300 disabled:opacity-50 transition-colors"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" /> Approve
                                </button>
                              )}
                              {payment.status !== "rejected" && payment.status !== "paid" && (
                                <button
                                  title="Reject / Not Paid"
                                  disabled={isPending}
                                  onClick={() => markAs(payment, "rejected")}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium border border-red-300 disabled:opacity-50 transition-colors"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </button>
                              )}
                              {(payment.status === "paid" || payment.status === "rejected") && (
                                <button
                                  title="Reset to Pending"
                                  disabled={isPending}
                                  onClick={() => markAs(payment, "pending")}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-medium border border-gray-300 disabled:opacity-50 transition-colors"
                                >
                                  <Clock className="h-3.5 w-3.5" /> Reset
                                </button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleEditPayment(payment)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-muted-foreground">
                            {payments.length === 0 ? "No payment requests yet" : "No results match your filters"}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Table Totals Footer */}
              {filteredPayments.length > 0 && (
                <div className="border-t bg-muted/20 px-4 py-3 flex flex-wrap gap-6 text-sm">
                  <span>
                    <span className="text-muted-foreground">Requested: </span>
                    <strong className="text-blue-700">
                      ${filteredPayments.reduce((s, p) => s + (parseFloat(p.amountRequested) || 0), 0).toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Paid: </span>
                    <strong className="text-green-700">
                      ${filteredPayments.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0).toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Remaining: </span>
                    <strong className="text-red-600">
                      ${filteredPayments
                        .reduce((s, p) => s + Math.max(0, (parseFloat(p.amountRequested) || 0) - (parseFloat(p.amountPaid) || 0)), 0)
                        .toFixed(2)}
                    </strong>
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {filteredPayments.length} {filteredPayments.length === 1 ? "row" : "rows"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </AdvancedPermissionGuard>

        {/* Partial Payment Modal */}
        <Dialog open={isPartialModalOpen} onOpenChange={setIsPartialModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Record Partial Payment
              </DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Work Order</span>
                    <span className="font-medium">{selectedPayment.workOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Technician</span>
                    <span className="font-medium">{selectedPayment.technicianName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Requested</span>
                    <span className="font-semibold text-blue-700">{fmt(selectedPayment.amountRequested)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partialAmt">Amount Paid So Far</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="partialAmt"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-9"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                    />
                  </div>
                  {partialAmount && (
                    <p className="text-xs text-muted-foreground">
                      Remaining: <strong className="text-red-600">
                        ${Math.max(0, (parseFloat(selectedPayment.amountRequested) || 0) - (parseFloat(partialAmount) || 0)).toFixed(2)}
                      </strong>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partialNotes">Notes (optional)</Label>
                  <Textarea
                    id="partialNotes"
                    placeholder="e.g. First instalment paid via Zelle..."
                    rows={2}
                    value={partialNotes}
                    onChange={(e) => setPartialNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsPartialModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handlePartialSubmit}
                    disabled={updatePaymentMutation.isPending || !partialAmount}
                  >
                    {updatePaymentMutation.isPending ? "Saving..." : "Save Partial Payment"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Full Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Payment
              </DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Work Order</span>
                    <span className="font-medium">{selectedPayment.workOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Technician</span>
                    <span className="font-medium">{selectedPayment.technicianName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested</span>
                    <span className="font-semibold text-blue-700">{fmt(selectedPayment.amountRequested)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="paid">Fully Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Amount Approved</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9"
                        value={editForm.amountApproved}
                        onChange={(e) => setEditForm((p) => ({ ...p, amountApproved: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount Paid</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9"
                        value={editForm.amountPaid}
                        onChange={(e) => setEditForm((p) => ({ ...p, amountPaid: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {editForm.amountRequested !== "" && (
                  <p className="text-sm text-muted-foreground">
                    Remaining after payment:{" "}
                    <strong className="text-red-600">
                      ${Math.max(0, (parseFloat(selectedPayment.amountRequested) || 0) - (parseFloat(editForm.amountPaid) || 0)).toFixed(2)}
                    </strong>
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    placeholder="Internal notes about this payment..."
                    rows={3}
                    value={editForm.adminNotes}
                    onChange={(e) => setEditForm((p) => ({ ...p, adminNotes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePayment} disabled={updatePaymentMutation.isPending}>
                    {updatePaymentMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Technician Payment History Modal */}
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Technician Payment History
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {/* History totals */}
              {technicianHistory.length > 0 && (
                <div className="flex gap-6 p-3 bg-muted/40 rounded-lg text-sm flex-wrap">
                  <span>
                    <span className="text-muted-foreground">Total Requested: </span>
                    <strong className="text-blue-700">
                      ${technicianHistory.reduce((s, p) => s + (parseFloat(p.amountRequested) || 0), 0).toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Total Paid: </span>
                    <strong className="text-green-700">
                      ${technicianHistory.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0).toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Outstanding: </span>
                    <strong className="text-red-600">
                      ${technicianHistory
                        .reduce((s, p) => s + Math.max(0, (parseFloat(p.amountRequested) || 0) - (parseFloat(p.amountPaid) || 0)), 0)
                        .toFixed(2)}
                    </strong>
                  </span>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicianHistory.map((payment) => {
                    const remaining = Math.max(0, (parseFloat(payment.amountRequested) || 0) - (parseFloat(payment.amountPaid) || 0));
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">{new Date(payment.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-blue-700">{payment.workOrderNumber}</TableCell>
                        <TableCell className="text-right">{fmt(payment.amountRequested)}</TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(payment.amountPaid) > 0 ? "text-green-700 font-medium" : "text-muted-foreground"}>
                            {parseFloat(payment.amountPaid) > 0 ? fmt(payment.amountPaid) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={remaining > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                            ${remaining.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {technicianHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No payment history for this technician
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  );
}
