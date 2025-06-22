import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Building, Smartphone, QrCode, ArrowLeftRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { WorkOrder } from "@shared/schema";

const paymentRequestSchema = z.object({
  technicianId: z.string().min(1, "Please select a technician"),
  amountRequested: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  paymentMethods: z.array(z.string()).min(1, "Please select at least one payment method"),
});

type PaymentRequestForm = z.infer<typeof paymentRequestSchema>;

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
}

const paymentMethodsInfo = {
  bank_transfer: {
    name: "Bank Transfer",
    icon: "🏦",
    description: "Direct bank transfer",
    details: ["Account Number", "Routing Number", "Bank Name"]
  },
  paypal: {
    name: "PayPal",
    icon: "💳",
    description: "PayPal payment",
    details: ["PayPal Link", "Email Address"]
  },
  venmo: {
    name: "Venmo",
    icon: "📱",
    description: "Venmo transfer",
    details: ["Venmo", "QR Code"]
  },
  cashapp: {
    name: "Cash App",
    icon: "💰",
    description: "Cash App payment",
    details: ["CashApp", "QR Code"]
  },
  zelle: {
    name: "Zelle",
    icon: "⚡",
    description: "Zelle quick pay",
    details: ["Phone Number", "Email Address"]
  },
  check: {
    name: "Check",
    icon: "📝",
    description: "Paper check",
    details: ["Mailing Address"]
  }
};

export function PaymentRequestModal({ isOpen, onClose, workOrder }: PaymentRequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

  const form = useForm<PaymentRequestForm>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      technicianId: "",
      amountRequested: "",
      description: "",
      paymentMethods: [],
    },
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["/api/technicians"],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrder.id}/payments`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Request Created",
        description: "Payment request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/payments`] });
      onClose();
      form.reset();
      setSelectedTechnician(null);
      setSelectedPaymentMethods([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    },
  });

  const handleTechnicianChange = (value: string) => {
    const technician = technicians.find((t: any) => t.id.toString() === value);
    setSelectedTechnician(technician);
    form.setValue("technicianId", value);
  };

  const handlePaymentMethodToggle = (method: string, checked: boolean) => {
    let newMethods;
    if (checked) {
      newMethods = [...selectedPaymentMethods, method];
    } else {
      newMethods = selectedPaymentMethods.filter(m => m !== method);
    }
    setSelectedPaymentMethods(newMethods);
    form.setValue("paymentMethods", newMethods);
  };

  const getAvailablePaymentMethods = (technician: any) => {
    if (!technician) return [];
    
    const methods = [];
    if (technician.bankAccount) methods.push("bank_transfer");
    if (technician.paypalLink || technician.paypalEmail) methods.push("paypal");
    if (technician.venmoHandle) methods.push("venmo");
    if (technician.cashappHandle) methods.push("cashapp");
    if (technician.zelleInfo) methods.push("zelle");
    if (technician.mailingAddress) methods.push("check");
    
    return methods;
  };

  const getPaymentDetails = (technician: any) => {
    if (!technician) return {};
    
    return {
      bank_transfer: {
        "Account Number": technician.bankAccount,
        "Routing Number": technician.routingNumber,
        "Bank Name": technician.bankName
      },
      paypal: {
        "PayPal Link": technician.paypalLink,
        "Email Address": technician.paypalEmail
      },
      venmo: {
        "Venmo": technician.venmoHandle,
        "QR Code": technician.venmoQR
      },
      cashapp: {
        "CashApp": technician.cashappHandle,
        "QR Code": technician.cashappQR
      },
      zelle: {
        "Phone Number": technician.phoneNumber,
        "Email Address": technician.zelleInfo
      },
      check: {
        "Mailing Address": technician.mailingAddress
      }
    };
  };

  const onSubmit = (data: PaymentRequestForm) => {
    createPaymentMutation.mutate({
      ...data,
      technicianId: parseInt(data.technicianId),
      paymentMethod: JSON.stringify(data.paymentMethods),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Create Payment Request - Work Order #{workOrder.workOrderNumber}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Technician Selection */}
            <FormField
              control={form.control}
              name="technicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Technician</FormLabel>
                  <Select onValueChange={handleTechnicianChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a technician" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {technicians.map((technician: any) => (
                        <SelectItem key={technician.id} value={technician.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <span>
                              {technician.firstName && technician.lastName 
                                ? `${technician.firstName} ${technician.lastName}`
                                : technician.name || `Technician #${technician.id}`
                              }
                            </span>
                            {technician.averageRating && (
                              <span className="text-sm text-gray-500">⭐ {technician.averageRating}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Methods - Only show when technician is selected */}
            {selectedTechnician && (
              <FormField
                control={form.control}
                name="paymentMethods"
                render={() => (
                  <FormItem>
                    <FormLabel>Available Payment Methods</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getAvailablePaymentMethods(selectedTechnician).map((method: string) => {
                        const methodInfo = paymentMethodsInfo[method as keyof typeof paymentMethodsInfo];
                        const technicianDetails = getPaymentDetails(selectedTechnician);
                        const isSelected = selectedPaymentMethods.includes(method);
                        
                        return (
                          <Card key={method} className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={method}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handlePaymentMethodToggle(method, checked as boolean)}
                                />
                                <label htmlFor={method} className="flex items-center space-x-2 cursor-pointer">
                                  <span className="text-lg">{methodInfo?.icon}</span>
                                  <div>
                                    <div className="font-medium">{methodInfo?.name}</div>
                                    <div className="text-sm text-gray-500">{methodInfo?.description}</div>
                                  </div>
                                </label>
                              </div>
                            </CardHeader>
                            
                            {isSelected && methodInfo && (
                              <CardContent className="pt-0">
                                <div className="space-y-2">
                                  <div className="font-medium text-sm text-blue-800">Payment Details:</div>
                                  {methodInfo.details.map((detail, idx) => {
                                    const value = technicianDetails[method]?.[detail];
                                    if (!value) return null;
                                    
                                    return (
                                      <div key={idx} className="flex flex-col space-y-1">
                                        <div className="text-xs font-medium text-gray-700">{detail}:</div>
                                        <div className="text-sm text-gray-900 bg-white p-2 rounded border font-mono">
                                          {detail === "PayPal Link" || detail === "Venmo" || detail === "CashApp" ? (
                                            <span className="text-blue-600">{value}</span>
                                          ) : detail === "QR Code" ? (
                                            <div className="flex items-center space-x-2">
                                              <span className="text-sm">QR Code Available</span>
                                              <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-xs">QR</div>
                                            </div>
                                          ) : (
                                            <span>{value}</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amountRequested"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Requested</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this payment request..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPaymentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createPaymentMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Create Payment Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}