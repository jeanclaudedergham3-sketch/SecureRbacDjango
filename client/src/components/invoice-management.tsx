import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Edit, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrder } from "@shared/schema";

interface InvoiceManagementProps {
  workOrder: WorkOrder;
  onOpenInvoiceModal: () => void;
}

export function InvoiceManagement({ workOrder, onOpenInvoiceModal }: InvoiceManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: [`/api/work-orders/${workOrder.id}/invoice`],
    enabled: !!workOrder.id,
  });

  console.log("Invoice data:", invoice);

  const handleCreateOrEdit = () => {
    if (workOrder.isLocked) {
      toast({
        title: "Action Blocked",
        description: "Cannot modify invoice - work order is locked due to paid invoice.",
        variant: "destructive",
      });
      return;
    }
    onOpenInvoiceModal();
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Download",
      description: "PDF download functionality coming soon",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create/Edit Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">ABC Corporation - Invoice Management</h3>
        <Button 
          onClick={handleCreateOrEdit} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={workOrder.isLocked}
        >
          {workOrder.isLocked ? (
            <>
              <Receipt className="h-4 w-4 mr-2" />
              Locked
            </>
          ) : invoice ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Invoice
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </>
          )}
        </Button>
      </div>

      {/* Invoice Display or Empty State */}
      {invoice ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div>
                <span className="text-blue-600">ABC Corporation - Invoice</span>
                <p className="text-sm text-gray-600 font-normal">Work Order: {workOrder.workOrderNumber}</p>
              </div>
              <Badge variant="outline" className="text-lg bg-blue-50 text-blue-700 border-blue-200">
                Total: ${parseFloat(invoice.totalAmount || "0").toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company & Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800">From: ABC Corporation</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Work Order #{workOrder.workOrderNumber}</p>
                  <p>Service Provider: ABC Corporation</p>
                  <p>Status: {workOrder.status}</p>
                  <p>Priority: {workOrder.priority}</p>
                  <p>Assigned To: {workOrder.assignedUsers?.map((u: any) => u.username).join(', ') || 'Unassigned'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800">Bill To:</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{workOrder.clientName}</p>
                  <p>{workOrder.street}</p>
                  <p>{workOrder.city}, {workOrder.state} {workOrder.zipCode}</p>
                  <p>{workOrder.phoneNumber}</p>
                  {workOrder.clientEmail && <p>Email: {workOrder.clientEmail}</p>}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-gray-800">Invoice Breakdown</h4>
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Labor Cost:</span>
                    <span className="font-medium">${parseFloat(invoice.laborCost || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-medium">${parseFloat(invoice.materialCost || "0").toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${(parseFloat(invoice.laborCost || "0") + parseFloat(invoice.materialCost || "0")).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Tax Amount:</span>
                    <span className="font-medium">${parseFloat(invoice.taxAmount || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 mt-2 border-t font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">${parseFloat(invoice.totalAmount || "0").toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Invoice Status</p>
                <Badge className={
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-yellow-100 text-yellow-800 border-yellow-200'
                }>
                  {invoice.status === 'paid' ? '✓ Paid' :
                   invoice.status === 'sent' ? '📧 Sent' :
                   '📝 Draft'}
                </Badge>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Invoice Date</p>
                <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            {invoice.notes && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Invoice Notes</p>
                <div className="bg-gray-50 p-3 rounded border text-sm">{invoice.notes}</div>
              </div>
            )}

            {/* Footer with Work Order Information */}
            <div className="border-t pt-4 text-center">
              <p className="text-xs text-gray-500">
                Work Order {workOrder.workOrderNumber} - Created: {new Date(workOrder.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-4 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={handleCreateOrEdit}
                disabled={workOrder.isLocked}
              >
                <Edit className="h-4 w-4 mr-2" />
                {workOrder.isLocked ? "Locked" : "Edit Invoice"}
              </Button>
              <Button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-medium mb-2">No Invoice Created</h3>
            <p className="text-gray-600 mb-6">
              Create a professional invoice for this work order from ABC Corporation.
              Include labor costs, materials, and tax calculations.
            </p>
            <Button 
              onClick={handleCreateOrEdit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={workOrder.isLocked}
            >
              <Plus className="h-4 w-4 mr-2" />
              {workOrder.isLocked ? "Locked - Cannot Create" : "Create ABC Corporation Invoice"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}