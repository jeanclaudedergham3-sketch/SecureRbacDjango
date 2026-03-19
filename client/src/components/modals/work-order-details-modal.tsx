import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, User, FileText, MessageSquare, CreditCard, Receipt, Upload, Hammer, DollarSign, Plus, Phone, Mail, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, BarChart3, Building, Pencil, X, Save, Users, ClipboardList, Clock, Shield, Printer, XCircle, Lock, Ban, Zap } from "lucide-react";
import { AdvancedPermissionGuard, TabGuard, ButtonGuard, useAdvancedPermissions } from "@/components/rbac/advanced-permission-guard";
import { WorkOrderProposalModal } from "@/components/modals/work-order-proposal-modal";
import { CreateInvoiceModal } from "@/components/modals/create-invoice-modal";
import { PartsRequestModal } from "@/components/modals/parts-request-modal";
import { FileUploadModal } from "@/components/modals/file-upload-modal";
import { ChatModal } from "@/components/modals/chat-modal";
import { PaymentRequestModalNew as PaymentRequestModal } from "@/components/modals/payment-request-modal-new";
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
  const { hasPermission } = useAdvancedPermissions();
  
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

  // Reject work order state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Inline financial editing state
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [financialEdit, setFinancialEdit] = useState({ nte: "", tnte: "", totalPayment: "" });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  const updateFinancialsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/work-orders/${workOrder.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Saved", description: "Financial details updated successfully." });
      setIsEditingFinancials(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
    },
  });

  const rejectWorkOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrder.id}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setIsRejectDialogOpen(false);
      setRejectReason("");
      toast({ title: "Work Order Rejected", description: "The work order has been rejected and locked.", variant: "destructive" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reject work order", variant: "destructive" });
    },
  });

  const isRejected = workOrder.status === "rejected" || (workOrder as any).isLocked;
  const isFastWorkOrder = !!(workOrder as any).isFastWorkOrder;

  const fastTrackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrder.id}/fast-track`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Fast Work Order Set", description: "This work order no longer requires a proposal." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update work order", variant: "destructive" });
    },
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

  const { data: clientPayments = [], refetch: refetchClientPayments } = useQuery({
    queryKey: [`/api/work-orders/${workOrder?.id}/client-payments`],
    enabled: !!workOrder?.id,
  });

  const [isAddingClientPayment, setIsAddingClientPayment] = useState(false);
  const [clientPaymentForm, setClientPaymentForm] = useState({
    paymentType: "full",
    amount: "",
    paymentMethod: "check",
    referenceNumber: "",
    notes: "",
  });

  const addClientPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/work-orders/${workOrder.id}/client-payments`, data),
    onSuccess: () => {
      toast({ title: "Payment recorded", description: "Client payment has been recorded successfully." });
      setIsAddingClientPayment(false);
      setClientPaymentForm({ paymentType: "full", amount: "", paymentMethod: "check", referenceNumber: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/client-payments`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record payment", variant: "destructive" });
    },
  });

  const confirmClientPaymentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/client-payments/${id}`, { status: "confirmed", receivedAt: new Date().toISOString() }),
    onSuccess: () => {
      toast({ title: "Payment confirmed", description: "Client payment confirmed successfully." });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/client-payments`] });
    },
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

  const handlePrintProposal = () => {
    if (!proposalData) return;
    try {
      const laborData = JSON.parse((proposalData as any).laborData || "[]");
      const partsData = JSON.parse((proposalData as any).partsData || "[]");
      const servicesData = JSON.parse((proposalData as any).servicesData || "[]");
      const laborTotal = laborData.reduce((s: number, i: any) => s + (parseFloat(i.payRate||"0") * parseFloat(i.regularHours||"0")) + (parseFloat(i.payRate||"0") * parseFloat(i.otHours||"0") * parseFloat(i.otScale||"1.5")), 0);
      const partsTotal = partsData.reduce((s: number, i: any) => s + parseFloat(i.unitCost||"0") * parseInt(i.quantity||"1"), 0);
      const servicesTotal = servicesData.reduce((s: number, i: any) => s + parseFloat(i.unitCost||"0") * parseInt(i.quantity||"1"), 0);
      const grandTotal = laborTotal + partsTotal + servicesTotal;

      const rows = (items: any[], type: string, color: string) => items.length === 0 ? "" : `
        <h3 style="color:${color};margin:16px 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.05em">${type}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:${color}15">
            <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd">Description</th>
            <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd">Qty/Hours</th>
            <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd">Rate</th>
            <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #ddd">Total</th>
          </tr></thead>
          <tbody>${items.map((item: any) => {
            const isLabor = type === "Labor";
            const desc = item.remark || item.transactionType || (isLabor ? "Labor" : type.slice(0,-1));
            const qty = isLabor ? `${item.regularHours||0}h reg + ${item.otHours||0}h OT` : (item.quantity||1);
            const rate = isLabor ? `$${parseFloat(item.payRate||"0").toFixed(2)}/hr` : `$${parseFloat(item.unitCost||"0").toFixed(2)}`;
            const total = isLabor
              ? (parseFloat(item.payRate||"0") * parseFloat(item.regularHours||"0")) + (parseFloat(item.payRate||"0") * parseFloat(item.otHours||"0") * parseFloat(item.otScale||"1.5"))
              : parseFloat(item.unitCost||"0") * parseInt(item.quantity||"1");
            return `<tr><td style="padding:5px 8px;border-bottom:1px solid #f0f0f0">${desc}</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f0f0f0">${qty}</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f0f0f0">${rate}</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f0f0f0;font-weight:600">$${total.toFixed(2)}</td></tr>`;
          }).join("")}</tbody>
        </table>`;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Proposal - ${workOrder.workOrderNumber}</title>
        <style>body{font-family:system-ui,sans-serif;color:#111;margin:0;padding:24px}@media print{body{padding:0}}</style>
      </head><body>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;border-bottom:3px solid #1e40af;padding-bottom:16px">
          <div>
            <h1 style="margin:0;color:#1e40af;font-size:22px">Work Order Proposal</h1>
            <p style="margin:4px 0 0;color:#555;font-size:15px">${workOrder.workOrderNumber} — ${workOrder.clientName}</p>
          </div>
          <div style="text-align:right;font-size:12px;color:#666">
            <div style="font-weight:600;margin-bottom:2px">Status: <span style="color:#1e40af">${(proposalData as any).status?.toUpperCase() || "PENDING"}</span></div>
            <div>Date: ${new Date((proposalData as any).createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:13px">
          <div><span style="color:#666">Client:</span> <strong>${workOrder.clientName}</strong></div>
          <div><span style="color:#666">Phone:</span> ${workOrder.clientPhone || "N/A"}</div>
          <div><span style="color:#666">Email:</span> ${workOrder.clientEmail || "N/A"}</div>
          <div><span style="color:#666">Address:</span> ${[workOrder.street, workOrder.city, workOrder.country].filter(Boolean).join(", ") || "N/A"}</div>
        </div>
        ${rows(laborData, "Labor", "#2563eb")}
        ${rows(partsData, "Parts", "#16a34a")}
        ${rows(servicesData, "Services", "#7c3aed")}
        <div style="margin-top:20px;border-top:2px solid #e5e7eb;padding-top:12px">
          <table style="width:100%;font-size:13px"><tbody>
            ${laborTotal > 0 ? `<tr><td style="padding:3px 0;color:#555">Labor Total</td><td style="text-align:right;font-weight:600;color:#2563eb">$${laborTotal.toFixed(2)}</td></tr>` : ""}
            ${partsTotal > 0 ? `<tr><td style="padding:3px 0;color:#555">Parts Total</td><td style="text-align:right;font-weight:600;color:#16a34a">$${partsTotal.toFixed(2)}</td></tr>` : ""}
            ${servicesTotal > 0 ? `<tr><td style="padding:3px 0;color:#555">Services Total</td><td style="text-align:right;font-weight:600;color:#7c3aed">$${servicesTotal.toFixed(2)}</td></tr>` : ""}
            <tr style="border-top:1px solid #e5e7eb"><td style="padding:8px 0;font-weight:700;font-size:15px">Grand Total</td><td style="text-align:right;font-weight:700;font-size:17px;color:#111">$${grandTotal.toFixed(2)}</td></tr>
          </tbody></table>
        </div>
        ${(proposalData as any).message ? `<div style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:6px;font-size:13px"><strong>Notes:</strong><br>${(proposalData as any).message}</div>` : ""}
        <div style="margin-top:24px;font-size:11px;color:#999;border-top:1px solid #e5e7eb;padding-top:8px">Printed on ${new Date().toLocaleString()}</div>
      </body></html>`;

      const w = window.open("", "_blank", "width=800,height=600");
      if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
    } catch {
      toast({ title: "Print Error", description: "Could not generate proposal for printing.", variant: "destructive" });
    }
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

  // For now, allow all authenticated users to view work order details
  // The backend already has proper permission checking on the API endpoints
  const canAccess = true;

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

  // Define all tabs with their permission requirements
  const allTabs = [
    { value: "overview",  label: "Overview",  icon: FileText,      permission: null },
    { value: "proposal",  label: "Proposal",  icon: Receipt,       permission: "workorders.tab.proposal" },
    { value: "financial", label: "Financial", icon: BarChart3,      permission: "workorders.tab.financial" },
    { value: "invoice",   label: "Invoice",   icon: DollarSign,    permission: "workorders.tab.invoice" },
    { value: "parts",     label: "Parts",     icon: Hammer,        permission: "workorders.tab.parts" },
    { value: "files",     label: "Files",     icon: Upload,        permission: "workorders.tab.files" },
    { value: "chat",      label: "Chat",      icon: MessageSquare, permission: "workorders.tab.chat" },
    { value: "payment",   label: "Payment",   icon: CreditCard,    permission: "workorders.tab.payment" },
  ];

  const visibleTabs = allTabs.filter(tab => !tab.permission || hasPermission(tab.permission));
  const canCreate = hasPermission("buttons.create");

  const priorityConfig = {
    urgent: { color: "bg-red-500 text-white",       label: "URGENT" },
    high:   { color: "bg-orange-500 text-white",    label: "HIGH" },
    medium: { color: "bg-yellow-400 text-yellow-900", label: "MEDIUM" },
    low:    { color: "bg-green-400 text-green-900", label: "LOW" },
  };
  const statusConfig = {
    completed:   { color: "bg-emerald-500 text-white", label: "COMPLETED" },
    cancelled:   { color: "bg-red-500 text-white",     label: "CANCELLED" },
    in_progress: { color: "bg-blue-500 text-white",    label: "IN PROGRESS" },
    active:      { color: "bg-indigo-500 text-white",  label: "ACTIVE" },
  };
  const priorityStyle = priorityConfig[(workOrder.priority as keyof typeof priorityConfig)] || priorityConfig.medium;
  const statusStyle = statusConfig[(workOrder.status as keyof typeof statusConfig)] || { color: "bg-gray-500 text-white", label: workOrder.status.toUpperCase() };

  const actionButtons = canCreate ? [
    { label: "Proposal",   icon: FileText,  color: "bg-violet-600 hover:bg-violet-700", action: () => setIsProposalModalOpen(true) },
    { label: "Invoice",    icon: Receipt,   color: "bg-blue-600 hover:bg-blue-700",    action: () => setIsInvoiceModalOpen(true) },
    { label: "Parts",      icon: Hammer,    color: "bg-orange-500 hover:bg-orange-600", action: () => setIsPartsRequestModalOpen(true) },
    { label: "Upload",     icon: Upload,    color: "bg-teal-600 hover:bg-teal-700",    action: () => setIsFileUploadModalOpen(true) },
  ] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[960px] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 [&>button]:text-white [&>button]:opacity-80 [&>button:hover]:opacity-100">

        {/* ── Gradient Header ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-lg flex-shrink-0">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="text-white text-lg font-bold leading-tight">
                  {workOrder.workOrderNumber}
                </DialogTitle>
                <p className="text-slate-300 text-sm mt-0.5 truncate">{workOrder.clientName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityStyle.color}`}>
                  {priorityStyle.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusStyle.color}`}>
                  {statusStyle.label}
                </span>
                {workOrder.isLocked && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1">
                    <Receipt className="h-3 w-3" /> LOCKED
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Action Buttons — only visible if user has create permission */}
          {actionButtons.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actionButtons.map(btn => (
                <button
                  key={btn.label}
                  onClick={() => workOrder.isLocked
                    ? toast({ title: "Locked", description: "This work order is locked (invoice paid).", variant: "destructive" })
                    : btn.action()
                  }
                  disabled={workOrder.isLocked}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btn.color}`}
                >
                  <btn.icon className="h-3.5 w-3.5" />
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-lg mb-4 w-full">
            {visibleTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Rejection Banner — shown when rejected */}
            {isRejected && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                <Ban className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-red-700 text-sm">This work order has been REJECTED and is locked</p>
                  {(workOrder as any).rejectionReason && (
                    <p className="text-red-600 text-sm mt-1">
                      <span className="font-semibold">Reason: </span>{(workOrder as any).rejectionReason}
                    </p>
                  )}
                  {(workOrder as any).rejectedAt && (
                    <p className="text-red-400 text-xs mt-1">
                      Rejected on {new Date((workOrder as any).rejectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Lock className="h-5 w-5 text-red-400 flex-shrink-0" />
              </div>
            )}

            {/* Top Status Banner */}
            <div className={`rounded-xl p-4 text-white ${isRejected ? "bg-gradient-to-r from-red-700 to-red-500" : "bg-gradient-to-r from-blue-600 to-indigo-600"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${isRejected ? "text-red-200" : "text-blue-200"}`}>Work Order</p>
                  <p className="text-2xl font-bold">{workOrder.workOrderNumber}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    workOrder.priority === "urgent" ? "bg-red-500 text-white" :
                    workOrder.priority === "high" ? "bg-orange-400 text-white" :
                    workOrder.priority === "medium" ? "bg-yellow-300 text-yellow-900" :
                    "bg-green-300 text-green-900"
                  }`}>{(workOrder.priority || "medium").toUpperCase()} PRIORITY</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    workOrder.status === "completed" ? "bg-green-400 text-green-900" :
                    workOrder.status === "rejected" ? "bg-red-900 text-white" :
                    workOrder.status === "cancelled" ? "bg-red-400 text-white" :
                    "bg-blue-300 text-blue-900"
                  }`}>{(workOrder.status || "active").toUpperCase()}</span>
                  {/* Fast Work Order badge */}
                  {isFastWorkOrder && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">
                      <Zap className="h-3 w-3 fill-amber-900" />
                      FAST TRACK
                    </span>
                  )}
                  {/* Make Fast Work Order button — only if not fast and not rejected */}
                  {!isFastWorkOrder && !isRejected && (
                    <ButtonGuard permission="workorders.edit">
                      <button
                        onClick={() => fastTrackMutation.mutate()}
                        disabled={fastTrackMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/40 border border-amber-300/60 text-amber-100 text-xs font-semibold transition-all"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        {fastTrackMutation.isPending ? "Saving..." : "Fast Work Order"}
                      </button>
                    </ButtonGuard>
                  )}
                  {/* Reject button — only if not already rejected */}
                  {!isRejected && (
                    <ButtonGuard permission="workorders.edit">
                      <button
                        onClick={() => { setRejectReason(""); setIsRejectDialogOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold transition-all"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject Work Order
                      </button>
                    </ButtonGuard>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* CLIENT INFORMATION */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <Building className="h-4 w-4 text-blue-500" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900">{workOrder.clientName || <span className="text-gray-400 italic">Not provided</span>}</span>
                  </div>
                  {workOrder.clientWorkOrderNumber && (
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600">Client WO#: </span>
                      <span className="font-medium text-gray-800">{workOrder.clientWorkOrderNumber}</span>
                    </div>
                  )}
                  {workOrder.clientPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-700">{workOrder.clientPhone}</span>
                    </div>
                  )}
                  {workOrder.clientEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-700 break-all">{workOrder.clientEmail}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SERVICE LOCATION */}
              <Card className="border-l-4 border-l-red-400">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <MapPin className="h-4 w-4 text-red-500" />
                    Service Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1 text-sm">
                  {workOrder.street && <p className="font-medium text-gray-800">{workOrder.street}</p>}
                  <p className="text-gray-600">
                    {[workOrder.city, workOrder.country].filter(Boolean).join(", ")}
                    {workOrder.zipCode && <span className="ml-1">— {workOrder.zipCode}</span>}
                  </p>
                  {!workOrder.street && !workOrder.city && (
                    <p className="text-gray-400 italic text-xs">No address provided</p>
                  )}
                </CardContent>
              </Card>

              {/* WORK DETAILS */}
              <Card className="border-l-4 border-l-orange-400">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <Hammer className="h-4 w-4 text-orange-500" />
                    Work Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-3 text-sm">
                  {workOrder.equipmentType && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Equipment Type</p>
                      <p className="font-semibold text-gray-800">{workOrder.equipmentType}</p>
                    </div>
                  )}
                  {workOrder.description && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Description</p>
                      <p className="text-gray-700 leading-relaxed">{workOrder.description}</p>
                    </div>
                  )}
                  {workOrder.problemDescription && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-400 font-medium uppercase">Problem Description</p>
                      <p className="text-gray-700 leading-relaxed">{workOrder.problemDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* TIMELINE */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <Calendar className="h-4 w-4 text-green-500" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2 text-sm">
                  {workOrder.startDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Start Date</span>
                      <span className="font-semibold text-gray-800">{workOrder.startDate}</span>
                    </div>
                  )}
                  {workOrder.endDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> End Date</span>
                      <span className="font-semibold text-gray-800">{workOrder.endDate}</span>
                    </div>
                  )}
                  {workOrder.estimatedHours && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Estimated Hours</span>
                      <span className="font-semibold text-gray-800">{workOrder.estimatedHours}h</span>
                    </div>
                  )}
                  {!workOrder.startDate && !workOrder.endDate && (
                    <p className="text-gray-400 italic text-xs">No timeline set</p>
                  )}
                </CardContent>
              </Card>

              {/* TEAM ASSIGNMENT */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <Users className="h-4 w-4 text-purple-500" />
                    Team Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 text-sm">
                  {(() => {
                    const assignedTeam = (teams as any[]).find((t: any) => t.id === (workOrder as any).teamId);
                    if (assignedTeam) {
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-base">{assignedTeam.name}</span>
                          </div>
                          {assignedTeam.description && (
                            <p className="text-gray-500 text-xs">{assignedTeam.description}</p>
                          )}
                          {assignedTeam.members && assignedTeam.members.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {assignedTeam.members.map((m: any) => (
                                <span key={m.id} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs">
                                  <User className="h-2.5 w-2.5" />
                                  {m.technicianId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return <p className="text-gray-400 italic text-xs">No team assigned</p>;
                  })()}
                </CardContent>
              </Card>

              {/* INSTRUCTIONS & SAFETY */}
              <Card className="border-l-4 border-l-yellow-400">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <Shield className="h-4 w-4 text-yellow-500" />
                    Instructions & Safety
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-3 text-sm">
                  {workOrder.accessInstructions && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase mb-0.5">Access Instructions</p>
                      <p className="text-gray-700">{workOrder.accessInstructions}</p>
                    </div>
                  )}
                  {workOrder.specialInstructions && (
                    <div className={workOrder.accessInstructions ? "pt-2 border-t" : ""}>
                      <p className="text-xs text-gray-400 font-medium uppercase mb-0.5">Special Instructions</p>
                      <p className="text-gray-700">{workOrder.specialInstructions}</p>
                    </div>
                  )}
                  {workOrder.safetyRequirements && (
                    <div className={(workOrder.accessInstructions || workOrder.specialInstructions) ? "pt-2 border-t" : ""}>
                      <p className="text-xs text-amber-600 font-medium uppercase mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Safety Requirements
                      </p>
                      <p className="text-gray-700">{workOrder.safetyRequirements}</p>
                    </div>
                  )}
                  {!workOrder.accessInstructions && !workOrder.specialInstructions && !workOrder.safetyRequirements && (
                    <p className="text-gray-400 italic text-xs">No instructions provided</p>
                  )}
                </CardContent>
              </Card>

              {/* FINANCIAL DETAILS — full width with inline edit */}
              <Card className="md:col-span-2 border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      Financial Details
                    </CardTitle>
                    {!isEditingFinancials ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setFinancialEdit({
                            nte: (workOrder as any).nte || "",
                            tnte: (workOrder as any).tnte || "",
                            totalPayment: (workOrder as any).totalPayment || "",
                          });
                          setIsEditingFinancials(true);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-green-600 hover:text-green-800"
                          disabled={updateFinancialsMutation.isPending}
                          onClick={() => updateFinancialsMutation.mutate({
                            nte: financialEdit.nte || null,
                            tnte: financialEdit.tnte || null,
                            totalPayment: financialEdit.totalPayment || null,
                          })}
                        >
                          <Save className="h-3 w-3 mr-1" /> {updateFinancialsMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-gray-500"
                          onClick={() => setIsEditingFinancials(false)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {isEditingFinancials ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 font-medium uppercase block mb-1">NTE (Before Tax)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={financialEdit.nte}
                          onChange={(e) => setFinancialEdit(prev => ({ ...prev, nte: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium uppercase block mb-1">TNTE (With Tax)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={financialEdit.tnte}
                          onChange={(e) => setFinancialEdit(prev => ({ ...prev, tnte: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium uppercase block mb-1">Total Payment</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={financialEdit.totalPayment}
                          onChange={(e) => setFinancialEdit(prev => ({ ...prev, totalPayment: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">NTE (Before Tax)</p>
                        <p className="text-lg font-bold text-blue-700">
                          {(workOrder as any).nte ? formatCurrency((workOrder as any).nte) : <span className="text-gray-400 text-sm font-normal italic">Not set</span>}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">TNTE (With Tax)</p>
                        <p className="text-lg font-bold text-green-700">
                          {(workOrder as any).tnte ? formatCurrency((workOrder as any).tnte) : <span className="text-gray-400 text-sm font-normal italic">Not set</span>}
                        </p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Total Payment</p>
                        <p className="text-lg font-bold text-indigo-700">
                          {(workOrder as any).totalPayment ? formatCurrency((workOrder as any).totalPayment) : <span className="text-gray-400 text-sm font-normal italic">Not set</span>}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Financial Status</p>
                        <Badge className={
                          workOrder.financialStatus === "paid" ? "bg-green-100 text-green-800 border-green-200" :
                          workOrder.financialStatus === "partial" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                          workOrder.financialStatus === "invoiced" ? "bg-blue-100 text-blue-800 border-blue-200" :
                          workOrder.financialStatus === "overdue" ? "bg-red-100 text-red-800 border-red-200" :
                          "bg-gray-100 text-gray-600 border-gray-200"
                        }>
                          {workOrder.financialStatus || "Pending"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabGuard tabName="proposal">
            <TabsContent value="proposal" className="space-y-4">
            {/* Fast Work Order notice */}
            {isFastWorkOrder && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5 fill-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Fast Work Order — No Proposal Required</p>
                  <p className="text-xs text-amber-700 mt-0.5">This work order has been marked as fast track. It can be completed and invoiced without an approved proposal. A proposal is still optional if needed.</p>
                </div>
              </div>
            )}
            {proposalData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Work Order Proposal</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePrintProposal}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                    <ButtonGuard buttonType="edit">
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
                    </ButtonGuard>
                  </div>
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
          </TabGuard>

          <TabsContent value="financial" className="space-y-4">
            {(() => {
              const nte = parseFloat(workOrder.nte || "0");
              const tnte = parseFloat(workOrder.tnte || "0");
              
              let proposalTotal = 0;
              let technicianCost = 0;
              let nteCost = 0;
              if (proposalData) {
                try {
                  const laborData = JSON.parse((proposalData as any).laborData || "[]");
                  const partsData = JSON.parse((proposalData as any).partsData || "[]");
                  const servicesData = JSON.parse((proposalData as any).servicesData || "[]");
                  const laborTotal = laborData.reduce((s: number, i: any) => {
                    const r = parseFloat(i.payRate||"0"); const h = parseFloat(i.regularHours||"0"); const ot = parseFloat(i.otHours||"0"); const os = parseFloat(i.otScale||"1.5");
                    return s + (r*h) + (r*ot*os);
                  }, 0);
                  const partsTotal = partsData.reduce((s: number, i: any) => s + parseFloat(i.unitCost||"0") * parseInt(i.quantity||"1"), 0);
                  const servicesTotal = servicesData.reduce((s: number, i: any) => s + parseFloat(i.unitCost||"0") * parseInt(i.quantity||"1"), 0);
                  proposalTotal = laborTotal + partsTotal + servicesTotal;
                  technicianCost = parseFloat((proposalData as any).technicianCost || "0");
                  nteCost = parseFloat((proposalData as any).nteCost || "0") || nte;
                } catch {}
              }
              
              const totalTechPayments = (existingPayments as any[]).reduce((s, p) => s + parseFloat(p.amountPaid||"0"), 0);
              const totalClientPayments = (clientPayments as any[]).reduce((s, p) => p.status === "confirmed" ? s + parseFloat(p.amount||"0") : s, 0);
              const profit = totalClientPayments - totalTechPayments;
              const isOverNTE = proposalTotal > nte && nte > 0;
              
              return (
                <div className="space-y-4">
                  {/* NTE vs Proposal Alert */}
                  {isOverNTE && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Warning: Proposal total (${proposalTotal.toFixed(2)}) exceeds NTE (${nte.toFixed(2)})</span>
                    </div>
                  )}
                  {!isOverNTE && proposalTotal > 0 && nte > 0 && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-800">
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Proposal is within NTE budget (${(nte - proposalTotal).toFixed(2)} remaining)</span>
                    </div>
                  )}
                  
                  {/* Financial Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-blue-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-2">NTE Budget</p>
                        <p className="text-2xl font-bold text-blue-700">${nte.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Not to Exceed</p>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-2">Proposal Total</p>
                        <p className={`text-2xl font-bold ${isOverNTE ? "text-red-600" : "text-orange-600"}`}>${proposalTotal.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Job Cost</p>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-2">Tech Payments</p>
                        <p className="text-2xl font-bold text-purple-700">${totalTechPayments.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Paid to Technicians</p>
                      </CardContent>
                    </Card>
                    <Card className={`border-${profit >= 0 ? "green" : "red"}-200`}>
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-2">Net Result</p>
                        <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">Client Paid - Tech Paid</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Cost Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Proposal Total</span>
                          <span className="font-medium">${proposalTotal.toFixed(2)}</span>
                        </div>
                        {technicianCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Technician Cost</span>
                            <span className="font-medium text-purple-600">${technicianCost.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Total Paid to Technicians</span>
                          <span className="font-bold text-red-600">${totalTechPayments.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Client Payments Received
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {(clientPayments as any[]).length === 0 ? (
                          <p className="text-gray-400 text-center py-2">No client payments recorded</p>
                        ) : (
                          (clientPayments as any[]).map((cp: any) => (
                            <div key={cp.id} className="flex justify-between items-center">
                              <div>
                                <span className="capitalize text-gray-600">{cp.paymentType.replace("_", " ")}</span>
                                <Badge className={`ml-2 text-xs ${cp.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                  {cp.status}
                                </Badge>
                              </div>
                              <span className="font-medium text-green-600">${parseFloat(cp.amount).toFixed(2)}</span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Total Confirmed</span>
                          <span className="font-bold text-green-600">${totalClientPayments.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Financial Status Update */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Update Financial Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {["pending","invoiced","partial","paid","overdue"].map(status => (
                          <Button
                            key={status}
                            size="sm"
                            variant={workOrder.financialStatus === status ? "default" : "outline"}
                            onClick={() => apiRequest("PATCH", `/api/work-orders/${workOrder.id}/financial-status`, { financialStatus: status }).then(() => {
                              toast({ title: "Updated", description: `Financial status set to ${status}` });
                              queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
                            })}
                            className="capitalize"
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

          <TabGuard tabName="invoice">
            <TabsContent value="invoice" className="space-y-4">
            <InvoiceManagement 
              workOrder={workOrder}
              onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
            />
          </TabsContent>
          </TabGuard>

          <TabGuard tabName="parts">
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
          </TabGuard>

          <TabGuard tabName="files">
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
          </TabGuard>

          <TabGuard tabName="chat">
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
          </TabGuard>

          <TabGuard tabName="payments">
            <TabsContent value="payment" className="space-y-6">
              {/* Client Payment Section */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Client Payments
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setIsAddingClientPayment(!isAddingClientPayment)}
                      disabled={workOrder.isLocked}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Record Payment
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Add Client Payment Form */}
                  {isAddingClientPayment && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                      <h4 className="font-medium text-green-800">Record Client Payment</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Payment Type</label>
                          <select
                            className="w-full mt-1 text-sm border rounded px-3 py-2"
                            value={clientPaymentForm.paymentType}
                            onChange={e => setClientPaymentForm(f => ({ ...f, paymentType: e.target.value }))}
                          >
                            <option value="down_payment">Down Payment</option>
                            <option value="full">Full Payment</option>
                            <option value="partial">Partial Payment</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Amount ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 text-sm border rounded px-3 py-2"
                            placeholder="0.00"
                            value={clientPaymentForm.amount}
                            onChange={e => setClientPaymentForm(f => ({ ...f, amount: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Payment Method</label>
                          <select
                            className="w-full mt-1 text-sm border rounded px-3 py-2"
                            value={clientPaymentForm.paymentMethod}
                            onChange={e => setClientPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                          >
                            <option value="check">Check</option>
                            <option value="ach">ACH Transfer</option>
                            <option value="wire">Wire Transfer</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Reference #</label>
                          <input
                            type="text"
                            className="w-full mt-1 text-sm border rounded px-3 py-2"
                            placeholder="Check # or ref"
                            value={clientPaymentForm.referenceNumber}
                            onChange={e => setClientPaymentForm(f => ({ ...f, referenceNumber: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Notes</label>
                        <textarea
                          className="w-full mt-1 text-sm border rounded px-3 py-2"
                          rows={2}
                          placeholder="Optional notes"
                          value={clientPaymentForm.notes}
                          onChange={e => setClientPaymentForm(f => ({ ...f, notes: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => addClientPaymentMutation.mutate(clientPaymentForm)}
                          disabled={!clientPaymentForm.amount || addClientPaymentMutation.isPending}
                        >
                          Save Payment
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsAddingClientPayment(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Client Payments List */}
                  {(clientPayments as any[]).length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No client payments recorded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {(clientPayments as any[]).map((cp: any) => (
                        <div key={cp.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize text-sm">{cp.paymentType.replace("_", " ")}</span>
                              <Badge className={cp.status === "confirmed" ? "bg-green-100 text-green-800" : cp.status === "received" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                {cp.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {cp.paymentMethod} {cp.referenceNumber && `• Ref: ${cp.referenceNumber}`}
                            </div>
                            {cp.notes && <div className="text-xs text-gray-500">{cp.notes}</div>}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">${parseFloat(cp.amount).toFixed(2)}</div>
                            {cp.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs mt-1"
                                onClick={() => confirmClientPaymentMutation.mutate(cp.id)}
                              >
                                Confirm
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t font-medium">
                        <span>Total Confirmed:</span>
                        <span className="text-green-600 text-lg">
                          ${(clientPayments as any[]).filter((p: any) => p.status === "confirmed").reduce((s: number, p: any) => s + parseFloat(p.amount), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technician Payment Requests Section */}
              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Technician Payment Requests
                    </div>
                    <ButtonGuard buttonType="create">
                      <Button 
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => workOrder.isLocked ? toast({
                          title: "Action Blocked",
                          description: "Work order is locked.",
                          variant: "destructive"
                        }) : setIsPaymentRequestModalOpen(true)} 
                        disabled={workOrder.isLocked}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Request Payment
                      </Button>
                    </ButtonGuard>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(existingPayments as any[]).length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No technician payment requests yet</p>
                  ) : (
                    <div className="space-y-3">
                      {(existingPayments as any[]).map((payment: any) => {
                        const technician = technicians.find(t => t.id === payment.technicianId);
                        const requested = parseFloat(payment.amountRequested || "0");
                        const paid = parseFloat(payment.amountPaid || "0");
                        const remaining = Math.max(0, requested - paid);
                        return (
                          <div key={payment.id} className="flex justify-between items-start p-3 bg-purple-50 border border-purple-100 rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {technician ? `${technician.firstName} ${technician.lastName}` : `Technician #${payment.technicianId}`}
                                </span>
                                <Badge className={
                                  payment.status === "paid" ? "bg-green-100 text-green-800" :
                                  payment.status === "approved" ? "bg-blue-100 text-blue-800" :
                                  payment.status === "rejected" ? "bg-red-100 text-red-800" :
                                  "bg-gray-100 text-gray-800"
                                }>
                                  {payment.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">{payment.description || "No description"}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-purple-600">${requested.toFixed(2)}</div>
                              {paid > 0 && <div className="text-xs text-green-600">Paid: ${paid.toFixed(2)}</div>}
                              {remaining > 0 && <div className="text-xs text-red-600">Rem: ${remaining.toFixed(2)}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
          </TabsContent>
          </TabGuard>
        </Tabs>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>

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
                                  {technician ? `${technician.firstName} ${technician.lastName}` : `Technician #${payment.technicianId}`}
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

      {/* Reject Work Order Dialog */}
      {isRejectDialogOpen && (
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Work Order
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-semibold">This action will lock the work order.</p>
                  <p className="mt-1 text-red-600">All editing, proposals, payments, and other actions will be disabled. This cannot be undone from the interface.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border text-sm text-slate-700">
                <span className="text-slate-500">Work Order: </span>
                <span className="font-semibold">{workOrder.workOrderNumber}</span>
                {workOrder.title && (
                  <span className="text-slate-500"> — {workOrder.title}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Why is this work order being rejected? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Enter the rejection reason — e.g. Client cancelled, budget not approved, duplicate work order..."
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="border-red-200 focus:border-red-400 resize-none"
                />
                {rejectReason.trim().length > 0 && (
                  <p className="text-xs text-slate-400">{rejectReason.trim().length} characters</p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setIsRejectDialogOpen(false); setRejectReason(""); }}
                  disabled={rejectWorkOrderMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  disabled={!rejectReason.trim() || rejectWorkOrderMutation.isPending}
                  onClick={() => rejectWorkOrderMutation.mutate(rejectReason)}
                >
                  <XCircle className="h-4 w-4" />
                  {rejectWorkOrderMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}