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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Edit, History, CheckCircle, XCircle, Clock, AlertCircle, Receipt, CheckCircle2, Eye } from "lucide-react";
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
}

interface InvoiceRequest {
  id: number;
  workOrderId: number;
  workOrderNumber: string;
  clientName: string;
  invoiceNumber: string;
  laborCost: string;
  materialCost: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  notes: string;
  rejectionReason: string;
  requestedBy: number;
  approvedBy: number;
  createdAt: string;
  isLocked: boolean;
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
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequest | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("payments");

  const [editForm, setEditForm] = useState({
    amountApproved: "",
    amountPaid: "",
    status: "",
    adminNotes: ""
  });

  const { data: payments = [], isLoading } = useQuery<PaymentRequest[]>({
    queryKey: ["/api/payments/all"],
  });

  const { data: invoiceRequests = [], isLoading: isLoadingInvoices } = useQuery<InvoiceRequest[]>({
    queryKey: ["/api/invoices/all"],
  });

  const pendingInvoices = invoiceRequests.filter(i => i.status === "pending_approval");

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
      toast({ title: "Success", description: "Payment updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/all"] });
      setIsEditModalOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update payment", variant: "destructive" });
    },
  });

  const approveInvoiceMutation = useMutation({
    mutationFn: (invoiceId: number) => apiRequest("POST", `/api/invoices/${invoiceId}/approve`, {}),
    onSuccess: () => {
      toast({ title: "Invoice Approved", description: "Work order has been locked." });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setIsInvoiceDetailOpen(false);
      setSelectedInvoice(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to approve invoice", variant: "destructive" });
    },
  });

  const rejectInvoiceMutation = useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: number; reason: string }) =>
      apiRequest("POST", `/api/invoices/${invoiceId}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Invoice Rejected", description: "Requester has been notified." });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/all"] });
      setIsRejectModalOpen(false);
      setIsInvoiceDetailOpen(false);
      setSelectedInvoice(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to reject invoice", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "partially_paid": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "approved": return <Clock className="h-4 w-4 text-blue-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": case "approved": return "bg-green-100 text-green-800";
      case "pending_approval": return "bg-yellow-100 text-yellow-800";
      case "partially_paid": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(String(val)) || 0);

  const calculateRemaining = (requested: string, paid: string) =>
    Math.max(0, (parseFloat(requested) || 0) - (parseFloat(paid) || 0));

  const handleEditPayment = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setEditForm({ amountApproved: payment.amountApproved || "", amountPaid: payment.amountPaid || "", status: payment.status, adminNotes: "" });
    setIsEditModalOpen(true);
  };

  const handleUpdatePayment = () => {
    if (!selectedPayment) return;
    updatePaymentMutation.mutate({ id: selectedPayment.id, updates: editForm });
  };

  const handleViewInvoice = (invoice: InvoiceRequest) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDetailOpen(true);
  };

  const getPaymentMethods = (technician: Technician) => {
    try { return JSON.parse(technician.paymentMethods || "[]"); } catch { return []; }
  };

  const formatPaymentMethod = (method: string) => {
    const labels: Record<string, string> = {
      paypal: "PayPal", credit_card: "Credit/Debit", bank_transfer: "Bank Transfer",
      digital_wallet: "Digital Wallet", cryptocurrency: "Crypto", cash: "Cash",
      venmo: "Venmo", cashapp: "Cash App", zelle: "Zelle", check: "Check", financing: "Financing"
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      paypal: "💳", credit_card: "💎", bank_transfer: "🏦", digital_wallet: "📱",
      cryptocurrency: "₿", cash: "💵", venmo: "📲", cashapp: "💸", zelle: "⚡", check: "📝", financing: "📊"
    };
    return icons[method] || "💳";
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Manager</h1>
            <p className="text-gray-600">Manage technician payment requests and invoice approvals</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{payments.length} payment requests</span>
            {pendingInvoices.length > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {pendingInvoices.length} invoice{pendingInvoices.length > 1 ? "s" : ""} pending review
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Requests
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 relative">
              <Receipt className="h-4 w-4" />
              Invoice Requests
              {pendingInvoices.length > 0 && (
                <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingInvoices.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Payment Requests Tab ── */}
          <TabsContent value="payments">
            <AdvancedPermissionGuard permission="payments.view">
              <Card>
                <CardHeader>
                  <CardTitle>Technician Payment Requests</CardTitle>
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
                        const methods = technician ? getPaymentMethods(technician) : [];
                        const remaining = calculateRemaining(payment.amountRequested, payment.amountPaid);
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.workOrderNumber}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{payment.technicianName}</div>
                                <Button variant="link" size="sm" className="p-0 h-auto text-blue-600"
                                  onClick={() => { setSelectedTechnicianId(payment.technicianId); setIsHistoryModalOpen(true); }}>
                                  <History className="h-3 w-3 mr-1" />View History
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {methods.length === 0
                                ? <Badge variant="outline">{payment.paymentMethod}</Badge>
                                : (
                                  <div className="flex flex-wrap gap-1">
                                    {methods.slice(0, 2).map((m: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {getPaymentMethodIcon(m)} {formatPaymentMethod(m)}
                                      </Badge>
                                    ))}
                                    {methods.length > 2 && <Badge variant="outline" className="text-xs">+{methods.length - 2} more</Badge>}
                                  </div>
                                )}
                            </TableCell>
                            <TableCell>{formatCurrency(payment.amountRequested)}</TableCell>
                            <TableCell>{payment.amountApproved ? formatCurrency(payment.amountApproved) : "-"}</TableCell>
                            <TableCell>{payment.amountPaid ? formatCurrency(payment.amountPaid) : "-"}</TableCell>
                            <TableCell>
                              <span className={remaining > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                                {formatCurrency(remaining)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(payment.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(payment.status)}
                                  <span className="capitalize">{payment.status.replace("_", " ")}</span>
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => handleEditPayment(payment)}>
                                <Edit className="h-3 w-3 mr-1" />Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {payments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            No payment requests found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </AdvancedPermissionGuard>
          </TabsContent>

          {/* ── Invoice Requests Tab ── */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Invoice Requests
                  <span className="text-sm font-normal text-gray-500">
                    — Only invoices for work orders assigned to you are shown
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInvoices ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : invoiceRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="font-medium">No invoice requests</p>
                    <p className="text-sm mt-1">Invoice requests for your assigned work orders will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoiceRequests.map((invoice) => (
                      <Card key={invoice.id} className={`border-2 ${
                        invoice.status === "pending_approval" ? "border-yellow-300 bg-yellow-50/30" :
                        invoice.status === "approved" ? "border-green-300 bg-green-50/30" :
                        invoice.status === "rejected" ? "border-red-300 bg-red-50/30" :
                        "border-gray-200"
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">{invoice.workOrderNumber}</span>
                                <span className="text-gray-500">·</span>
                                <span className="text-gray-600">{invoice.clientName}</span>
                                <Badge className={getStatusColor(invoice.status)}>
                                  {invoice.status === "pending_approval" ? "⏳ Pending Review" :
                                   invoice.status === "approved" ? "✓ Approved" :
                                   invoice.status === "rejected" ? "✗ Rejected" :
                                   invoice.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs">Labor</p>
                                  <p className="font-semibold text-blue-700">{formatCurrency(invoice.laborCost)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Materials</p>
                                  <p className="font-semibold text-green-700">{formatCurrency(invoice.materialCost)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Tax ({(parseFloat(invoice.taxRate || "0") * 100).toFixed(1)}%)</p>
                                  <p className="font-semibold">{formatCurrency(invoice.taxAmount)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Total</p>
                                  <p className="font-bold text-lg text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                </div>
                              </div>

                              {invoice.status === "rejected" && invoice.rejectionReason && (
                                <p className="text-sm text-red-700 bg-red-50 rounded px-3 py-1.5 border border-red-200">
                                  Rejected: {invoice.rejectionReason}
                                </p>
                              )}

                              {invoice.notes && (
                                <p className="text-sm text-gray-600 italic">Note: {invoice.notes}</p>
                              )}

                              <p className="text-xs text-gray-400">
                                Requested: {new Date(invoice.createdAt).toLocaleDateString()}
                                {" · "}Invoice #{invoice.invoiceNumber}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {invoice.status === "pending_approval" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => approveInvoiceMutation.mutate(invoice.id)}
                                    disabled={approveInvoiceMutation.isPending}
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setSelectedInvoice(invoice); setIsRejectModalOpen(true); }}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Edit Payment Modal ── */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Payment Request</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                  <p><span className="font-medium">Work Order:</span> {selectedPayment.workOrderNumber}</p>
                  <p><span className="font-medium">Technician:</span> {selectedPayment.technicianName}</p>
                  <p><span className="font-medium">Requested:</span> {formatCurrency(selectedPayment.amountRequested)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Amount Approved</Label>
                  <Input type="number" step="0.01" placeholder="0.00"
                    value={editForm.amountApproved}
                    onChange={(e) => setEditForm(p => ({ ...p, amountApproved: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Amount Paid</Label>
                  <Input type="number" step="0.01" placeholder="0.00"
                    value={editForm.amountPaid}
                    onChange={(e) => setEditForm(p => ({ ...p, amountPaid: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Admin Notes</Label>
                  <Textarea placeholder="Add notes..."
                    value={editForm.adminNotes}
                    onChange={(e) => setEditForm(p => ({ ...p, adminNotes: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdatePayment} disabled={updatePaymentMutation.isPending}>
                    {updatePaymentMutation.isPending ? "Updating..." : "Update Payment"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Invoice Detail Modal ── */}
        <Dialog open={isInvoiceDetailOpen} onOpenChange={setIsInvoiceDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invoice Request Details</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{selectedInvoice.workOrderNumber}</p>
                    <p className="text-gray-600">{selectedInvoice.clientName}</p>
                    <p className="text-sm text-gray-400">#{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <Badge className={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status === "pending_approval" ? "Pending Review" : selectedInvoice.status}
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg border p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Labor (Approved Payments)</span><span className="font-medium">{formatCurrency(selectedInvoice.laborCost)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Materials (Approved Parts)</span><span className="font-medium">{formatCurrency(selectedInvoice.materialCost)}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Tax ({(parseFloat(selectedInvoice.taxRate || "0") * 100).toFixed(1)}%)</span><span className="font-medium">{formatCurrency(selectedInvoice.taxAmount)}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold text-base"><span>Total</span><span className="text-blue-600">{formatCurrency(selectedInvoice.totalAmount)}</span></div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">{selectedInvoice.notes}</p>
                  </div>
                )}

                {selectedInvoice.status === "rejected" && selectedInvoice.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                    <p className="text-sm text-red-700 mt-1">{selectedInvoice.rejectionReason}</p>
                  </div>
                )}

                {selectedInvoice.status === "pending_approval" && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => approveInvoiceMutation.mutate(selectedInvoice.id)}
                      disabled={approveInvoiceMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {approveInvoiceMutation.isPending ? "Approving..." : "Approve — Lock Work Order"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setIsRejectModalOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Reject Invoice Modal ── */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Invoice Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Provide a reason. The requester will be notified and can re-submit a corrected invoice.
              </p>
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <Textarea
                  placeholder="Explain why this invoice request is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsRejectModalOpen(false); setRejectReason(""); }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedInvoice && rejectInvoiceMutation.mutate({ invoiceId: selectedInvoice.id, reason: rejectReason })}
                  disabled={rejectInvoiceMutation.isPending || !rejectReason.trim()}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {rejectInvoiceMutation.isPending ? "Rejecting..." : "Reject Invoice"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Payment History Modal ── */}
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>Technician Payment History</DialogTitle></DialogHeader>
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
                    <TableCell>{new Date(payment.requestedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.workOrderNumber}</TableCell>
                    <TableCell>{formatCurrency(payment.amountRequested)}</TableCell>
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
                    <TableCell colSpan={5} className="text-center py-4">No payment history found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  );
}
