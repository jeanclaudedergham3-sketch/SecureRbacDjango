import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, Send, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrder } from "@shared/schema";

interface InvoiceManagementProps {
  workOrder: WorkOrder;
  onOpenInvoiceModal?: () => void;
}

export function InvoiceManagement({ workOrder }: InvoiceManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { data: invoice, isLoading } = useQuery<any>({
    queryKey: [`/api/work-orders/${workOrder.id}/invoice`],
    enabled: !!workOrder.id,
  });

  const { data: payments = [] } = useQuery<any[]>({
    queryKey: [`/api/work-orders/${workOrder.id}/payments`],
    enabled: !!workOrder.id,
  });

  const { data: partsRequests = [] } = useQuery<any[]>({
    queryKey: [`/api/work-orders/${workOrder.id}/parts-requests`],
    enabled: !!workOrder.id,
  });

  // Sum approved technician payments (labor cost)
  const approvedPayments = payments.filter((p: any) =>
    p.status === "approved" || p.status === "paid" || p.status === "partially_paid"
  );
  const laborCost = approvedPayments.reduce(
    (sum: number, p: any) => sum + parseFloat(p.amountApproved || p.amountRequested || "0"),
    0
  );

  // Sum approved parts costs
  const approvedParts = partsRequests.filter((r: any) =>
    r.status === "approved" || r.status === "ordered" || r.status === "received"
  );
  const materialCost = approvedParts.reduce((sum: number, r: any) => {
    try {
      const parts = JSON.parse(r.parts || "[]");
      return sum + parts.reduce((s: number, p: any) =>
        s + parseFloat(p.estimatedCost || "0") * parseInt(p.quantity || "1"), 0);
    } catch {
      return sum + parseFloat(r.estimatedCost || "0") * parseInt(r.quantity || "1");
    }
  }, 0);

  const subtotal = laborCost + materialCost;
  const taxRateNum = parseFloat(taxRate) || 0;
  const taxAmount = subtotal * (taxRateNum / 100);
  const totalAmount = subtotal + taxAmount;

  const submitInvoiceMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/work-orders/${workOrder.id}/invoice`, {
        laborCost: laborCost.toString(),
        materialCost: materialCost.toString(),
        additionalCosts: "0",
        subtotal: subtotal.toString(),
        taxRate: (taxRateNum / 100).toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes,
      }),
    onSuccess: () => {
      toast({ title: "Invoice Requested", description: "Your invoice request has been sent for approval." });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/invoice`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/all"] });
      setIsRequestModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit invoice request", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invoices/${invoice?.id}/approve`, {}),
    onSuccess: () => {
      toast({ title: "Invoice Approved", description: "Work order is now locked." });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/invoice`] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/all"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invoices/${invoice?.id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      toast({ title: "Invoice Rejected", description: "A notification has been sent to the requester." });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/invoice`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/all"] });
      setIsRejectModalOpen(false);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to reject", variant: "destructive" });
    },
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const status = invoice?.status;

  return (
    <div className="space-y-4">

      {/* ── Status Banner ── */}
      {status === "pending_approval" && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-800">Invoice Request Pending Review</p>
            <p className="text-sm text-yellow-700">
              This invoice has been submitted and is awaiting approval on the Payment Manager page.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-700 hover:bg-red-50"
              onClick={() => setIsRejectModalOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Invoice Approved — Work Order Locked</p>
            <p className="text-sm text-green-700">This invoice has been approved and the work order is locked.</p>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-300 rounded-lg">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Invoice Request Rejected</p>
            {invoice?.rejectionReason && (
              <p className="text-sm text-red-700">Reason: {invoice.rejectionReason}</p>
            )}
            <p className="text-sm text-red-600 mt-1">You can correct and re-submit a new invoice request.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsRequestModalOpen(true)}
            disabled={workOrder.isLocked}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Re-request
          </Button>
        </div>
      )}

      {/* ── Invoice Summary Card ── */}
      {invoice ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div>
                <span className="text-blue-600">Invoice {invoice.invoiceNumber}</span>
                <p className="text-sm text-gray-500 font-normal mt-0.5">Work Order: {workOrder.workOrderNumber}</p>
              </div>
              <Badge
                className={
                  status === "approved" ? "bg-green-100 text-green-800 border-green-300" :
                  status === "rejected" ? "bg-red-100 text-red-800 border-red-300" :
                  status === "pending_approval" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                  "bg-gray-100 text-gray-700"
                }
              >
                {status === "pending_approval" ? "Pending Approval" :
                 status === "approved" ? "✓ Approved" :
                 status === "rejected" ? "✗ Rejected" :
                 status || "Draft"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Labor (Approved Payments)</span>
                <span className="font-medium">{formatCurrency(parseFloat(invoice.laborCost || "0"))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Materials (Approved Parts)</span>
                <span className="font-medium">{formatCurrency(parseFloat(invoice.materialCost || "0"))}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(parseFloat(invoice.subtotal || "0"))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({(parseFloat(invoice.taxRate || "0") * 100).toFixed(1)}%)</span>
                <span className="font-medium">{formatCurrency(parseFloat(invoice.taxAmount || "0"))}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(parseFloat(invoice.totalAmount || "0"))}</span>
              </div>
            </div>
            {invoice.notes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">{invoice.notes}</p>
              </div>
            )}
            <div className="text-xs text-gray-500">
              Requested: {new Date(invoice.createdAt).toLocaleDateString()}
            </div>

            {/* Re-request button (only when rejected) is in the banner above */}
            {/* No edit allowed for invoice requests — they go through approval flow */}
          </CardContent>
        </Card>
      ) : (
        /* ── No Invoice Yet ── */
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-semibold mb-2">No Invoice Requested</h3>
            <p className="text-gray-600 mb-2 max-w-sm mx-auto">
              Submit an invoice request that will show the approved technician payments and approved parts costs.
              It will be reviewed by a payment manager.
            </p>
            {approvedPayments.length === 0 && approvedParts.length === 0 && (
              <div className="flex items-center gap-2 justify-center text-sm text-amber-600 mb-4">
                <AlertTriangle className="h-4 w-4" />
                No approved payments or parts found yet. You can still request an invoice.
              </div>
            )}
            <Button
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={workOrder.isLocked}
            >
              <Send className="h-4 w-4 mr-2" />
              Request Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Request Invoice Modal ── */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Invoice — {workOrder.workOrderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Auto-populated costs */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800 mb-2">Auto-populated from approved records</p>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Labor — Approved Payments</p>
                {approvedPayments.length > 0 ? (
                  approvedPayments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm bg-white rounded px-3 py-1.5 border">
                      <span className="text-gray-700">Technician payment #{p.id}</span>
                      <span className="font-medium">{formatCurrency(parseFloat(p.amountApproved || p.amountRequested || "0"))}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No approved payments</p>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1">
                  <span>Labor Total</span>
                  <span className="text-blue-700">{formatCurrency(laborCost)}</span>
                </div>
              </div>

              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Materials — Approved Parts</p>
                {approvedParts.length > 0 ? (
                  approvedParts.map((r: any) => (
                    <div key={r.id} className="flex justify-between text-sm bg-white rounded px-3 py-1.5 border">
                      <span className="text-gray-700">{r.partName || `Parts Request #${r.id}`}</span>
                      <span className="font-medium">{formatCurrency(parseFloat(r.estimatedCost || "0") * parseInt(r.quantity || "1"))}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No approved parts</p>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1">
                  <span>Materials Total</span>
                  <span className="text-green-700">{formatCurrency(materialCost)}</span>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <p className="text-xs text-gray-500">Enter 0 if no tax applies</p>
            </div>

            {/* Total summary */}
            <div className="bg-gray-50 rounded-lg border p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({taxRateNum.toFixed(1)}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes for the payment manager..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => submitInvoiceMutation.mutate()}
                disabled={submitInvoiceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitInvoiceMutation.isPending ? "Submitting..." : "Submit Invoice Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reject Modal ── */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Invoice Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejection. The requester will be notified and can re-submit.
            </p>
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                placeholder="Explain why this invoice request is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {rejectMutation.isPending ? "Rejecting..." : "Reject Invoice"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
