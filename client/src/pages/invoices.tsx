import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Plus, Printer, Calculator, DollarSign, Clock } from "lucide-react";
import { z } from "zod";

interface WorkOrder {
  id: number;
  workOrderNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  proposalApprovedAt: string | null;
}

interface Invoice {
  id: number;
  workOrderId: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  partsSubtotal: string;
  laborSubtotal: string;
  extraAmount: string;
  extraDescription: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  status: string;
  dueDate: string;
  issuedAt: string;
  paidAt: string | null;
  notes: string;
}

interface InvoiceCalculation {
  partsSubtotal: number;
  laborSubtotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

const createInvoiceSchema = z.object({
  workOrderId: z.number(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  customerAddress: z.string().min(1, "Address is required"),
  extraAmount: z.string().default("0"),
  extraDescription: z.string().default(""),
  notes: z.string().default(""),
});

type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const form = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      extraAmount: "0",
      extraDescription: "",
      notes: "",
    },
  });

  // Get all work orders with approved proposals
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const eligibleWorkOrders = workOrders.filter(wo => 
    wo.status === "proposal_approved" || wo.proposalApprovedAt
  );

  // Get all invoices
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Get invoice calculation for selected work order
  const { data: calculation } = useQuery<InvoiceCalculation>({
    queryKey: [`/api/work-orders/${selectedWorkOrder?.id}/invoice-calculation`],
    enabled: !!selectedWorkOrder,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: CreateInvoiceFormData) => 
      apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setIsCreateModalOpen(false);
      setSelectedWorkOrder(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvoice = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    form.setValue("workOrderId", workOrder.id);
    form.setValue("customerName", workOrder.clientName);
    form.setValue("customerEmail", workOrder.clientEmail || "");
    form.setValue("customerPhone", workOrder.clientPhone || "");
    setIsCreateModalOpen(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    // Create a printable invoice view
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const invoiceHtml = generateInvoiceHTML(invoice);
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateInvoiceHTML = (invoice: Invoice) => {
    const workOrder = workOrders.find(wo => wo.id === invoice.workOrderId);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>${invoice.invoiceNumber}</h2>
        </div>
        
        <div class="invoice-details">
          <p><strong>Work Order:</strong> ${workOrder?.workOrderNumber}</p>
          <p><strong>Customer:</strong> ${invoice.customerName}</p>
          <p><strong>Email:</strong> ${invoice.customerEmail}</p>
          <p><strong>Phone:</strong> ${invoice.customerPhone}</p>
          <p><strong>Address:</strong> ${invoice.customerAddress}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoice.issuedAt).toLocaleDateString()}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Parts & Materials</td>
              <td>$${parseFloat(invoice.partsSubtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Labor & Services</td>
              <td>$${parseFloat(invoice.laborSubtotal).toFixed(2)}</td>
            </tr>
            ${parseFloat(invoice.extraAmount) > 0 ? `
            <tr>
              <td>${invoice.extraDescription || "Additional Charges"}</td>
              <td>$${parseFloat(invoice.extraAmount).toFixed(2)}</td>
            </tr>
            ` : ""}
            <tr>
              <td><strong>Subtotal</strong></td>
              <td><strong>$${parseFloat(invoice.subtotal).toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td>Tax (${(parseFloat(invoice.taxRate) * 100).toFixed(1)}%)</td>
              <td>$${parseFloat(invoice.taxAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>TOTAL</strong></td>
              <td><strong>$${parseFloat(invoice.total).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ""}
      </body>
      </html>
    `;
  };

  const onSubmit = (data: CreateInvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const extraAmount = parseFloat(form.watch("extraAmount") || "0");
  const totalWithExtra = calculation ? calculation.subtotal + extraAmount + (calculation.subtotal + extraAmount) * 0.08 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoice Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible Work Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligibleWorkOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${invoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.status === "paid").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eligible Work Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Work Orders Ready for Invoicing</CardTitle>
        </CardHeader>
        <CardContent>
          {eligibleWorkOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No work orders with approved proposals found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proposal Approved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleWorkOrders.map((workOrder) => {
                  const hasInvoice = invoices.some(inv => inv.workOrderId === workOrder.id);
                  return (
                    <TableRow key={workOrder.id}>
                      <TableCell className="font-medium">
                        {workOrder.workOrderNumber}
                      </TableCell>
                      <TableCell>{workOrder.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{workOrder.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {workOrder.proposalApprovedAt 
                          ? new Date(workOrder.proposalApprovedAt).toLocaleDateString()
                          : "Yes"
                        }
                      </TableCell>
                      <TableCell>
                        {hasInvoice ? (
                          <Badge variant="secondary">Invoice Created</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCreateInvoice(workOrder)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Invoice
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Existing Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No invoices created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const workOrder = workOrders.find(wo => wo.id === invoice.workOrderId);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{workOrder?.workOrderNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>${parseFloat(invoice.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.issuedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintInvoice(invoice)}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create Invoice - {selectedWorkOrder?.workOrderNumber}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cost Breakdown */}
              {calculation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Parts & Materials:</span>
                      <span>${calculation.partsSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor & Services:</span>
                      <span>${calculation.laborSubtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="extraAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Amount</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="extraDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Description</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Additional charges description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <hr />
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${(calculation.subtotal + extraAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (8%):</span>
                      <span>${((calculation.subtotal + extraAmount) * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${totalWithExtra.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional notes for the invoice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInvoiceMutation.isPending}
                >
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Invoice {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedInvoice.customerName}</p>
                  <p><strong>Email:</strong> {selectedInvoice.customerEmail}</p>
                  <p><strong>Phone:</strong> {selectedInvoice.customerPhone}</p>
                  <p><strong>Address:</strong> {selectedInvoice.customerAddress}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Invoice Details</h3>
                  <p><strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </Badge>
                  </p>
                  <p><strong>Issue Date:</strong> {new Date(selectedInvoice.issuedAt).toLocaleDateString()}</p>
                  {selectedInvoice.paidAt && (
                    <p><strong>Paid Date:</strong> {new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Parts & Materials</TableCell>
                        <TableCell className="text-right">${parseFloat(selectedInvoice.partsSubtotal).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Labor & Services</TableCell>
                        <TableCell className="text-right">${parseFloat(selectedInvoice.laborSubtotal).toFixed(2)}</TableCell>
                      </TableRow>
                      {parseFloat(selectedInvoice.extraAmount) > 0 && (
                        <TableRow>
                          <TableCell>{selectedInvoice.extraDescription || "Additional Charges"}</TableCell>
                          <TableCell className="text-right">${parseFloat(selectedInvoice.extraAmount).toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell><strong>Subtotal</strong></TableCell>
                        <TableCell className="text-right"><strong>${parseFloat(selectedInvoice.subtotal).toFixed(2)}</strong></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tax ({(parseFloat(selectedInvoice.taxRate) * 100).toFixed(1)}%)</TableCell>
                        <TableCell className="text-right">${parseFloat(selectedInvoice.taxAmount).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>TOTAL</strong></TableCell>
                        <TableCell className="text-right"><strong>${parseFloat(selectedInvoice.total).toFixed(2)}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}