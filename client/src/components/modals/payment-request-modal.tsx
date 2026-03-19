import { useState, useEffect, useMemo, useCallback } from "react";
import { useWatch } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, CreditCard, Building, Smartphone, QrCode, ArrowLeftRight, User, Mail, Phone, MapPin, Star, Clock, Briefcase, Award, AlertTriangle, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdvancedPermissionGuard, ButtonGuard } from "@/components/rbac/advanced-permission-guard";
import { z } from "zod";
import type { WorkOrder } from "@shared/schema";

const paymentRequestSchema = z.object({
  technicianId: z.string().min(1, "Please select a technician"),
  amountRequested: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().optional(),
  paymentMethods: z.array(z.string()).min(1, "Please select at least one payment method"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueDate: z.string().optional(),
});

type PaymentRequestForm = z.infer<typeof paymentRequestSchema>;

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
}

const paymentMethodsInfo = {
  paypal: {
    name: "PayPal",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    description: "Secure online payments via PayPal",
    features: ["Instant transfers", "Buyer protection", "Mobile payments"],
    details: ["PayPal Link", "Email Address"]
  },
  credit_card: {
    name: "Credit/Debit Cards",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    description: "Accept all major credit and debit cards",
    features: ["Visa, MasterCard, Amex", "Secure processing", "Real-time approval"],
    details: ["Cardholder Name", "Card Number", "Expiry Date"]
  },
  bank_transfer: {
    name: "Bank Transfer",
    icon: <Building className="h-4 w-4" />,
    color: "bg-green-50 border-green-200 text-green-700",
    description: "Direct bank-to-bank transfers",
    features: ["ACH transfers", "Wire transfers", "Lower fees"],
    details: ["Account Number", "Routing Number", "Bank Name"]
  },
  cash: {
    name: "Cash Payment",
    icon: <DollarSign className="h-4 w-4" />,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    description: "Cash payments accepted on-site",
    features: ["No processing fees", "Immediate payment", "Receipt provided"],
    details: ["Cash Amount", "Receipt Number"]
  },
  venmo: {
    name: "Venmo",
    icon: <Smartphone className="h-4 w-4" />,
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
    description: "Popular peer-to-peer payment app",
    features: ["Social payments", "Instant transfers", "Mobile-first"],
    details: ["Venmo Handle", "QR Code"]
  },
  cashapp: {
    name: "Cash App",
    icon: <Smartphone className="h-4 w-4" />,
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    description: "Square's mobile payment service",
    features: ["Bitcoin support", "Stock investing", "Direct deposit"],
    details: ["CashApp Handle", "QR Code"]
  },
  zelle: {
    name: "Zelle",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    color: "bg-orange-50 border-orange-200 text-orange-700",
    description: "Bank-to-bank transfers in minutes",
    features: ["Direct bank integration", "Fast transfers", "No fees"],
    details: ["Phone Number", "Email Address"]
  },
  check: {
    name: "Check Payment",
    icon: <Mail className="h-4 w-4" />,
    color: "bg-gray-50 border-gray-200 text-gray-700",
    description: "Traditional check payments by mail",
    features: ["Mailed checks", "Paper trail", "Bank clearing"],
    details: ["Mailing Address", "Check Amount"]
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
      priority: "normal",
      dueDate: "",
    },
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["/api/technicians"],
  });

  const amountValue = useWatch({ control: form.control, name: "amountRequested" });

  const w9Blocked = useMemo(() => {
    if (!selectedTechnician) return false;
    const amount = parseFloat(amountValue || "0");
    if (amount < 500) return false;
    return selectedTechnician.w9Status !== "submitted";
  }, [selectedTechnician, amountValue]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSelectedTechnician(null);
      setSelectedPaymentMethods([]);
    }
  }, [isOpen]); // Remove form from dependencies to prevent infinite loop

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrder?.id}/payments`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Request Created",
        description: "Payment request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder?.id}/payments`] });
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
    const technician = (technicians as any[]).find((t: any) => t.id.toString() === value);
    setSelectedTechnician(technician);
    form.setValue("technicianId", value);
    // Reset payment methods when technician changes
    setSelectedPaymentMethods([]);
    form.setValue("paymentMethods", []);
  };

  const handlePaymentMethodToggle = (method: string, checked: boolean) => {
    let newMethods: string[];
    if (checked) {
      newMethods = [...selectedPaymentMethods, method];
    } else {
      newMethods = selectedPaymentMethods.filter(m => m !== method);
    }
    
    setSelectedPaymentMethods(newMethods);
    form.setValue("paymentMethods", newMethods);
  };

  const availablePaymentMethods = useMemo(() => {
    if (!selectedTechnician || !selectedTechnician.paymentMethods) return [];
    
    try {
      // First try to parse as JSON (new format)
      if (selectedTechnician.paymentMethods.startsWith('[')) {
        const methods = JSON.parse(selectedTechnician.paymentMethods);
        return Array.isArray(methods) ? methods : [];
      }
      
      // Parse as comma-separated string (current database format)
      const methods = selectedTechnician.paymentMethods
        .split(',')
        .map((method: string) => method.trim())
        .filter((method: string) => method.length > 0);
      return methods;
    } catch {
      return [];
    }
  }, [selectedTechnician]);

  const paymentDetails = useMemo(() => {
    if (!selectedTechnician) return {};
    
    try {
      const details = JSON.parse(selectedTechnician.paymentDetails || "{}");
      return details;
    } catch {
      return {};
    }
  }, [selectedTechnician]);

  const onSubmit = (data: PaymentRequestForm) => {
    const payload = {
      technicianId: parseInt(data.technicianId),
      amountRequested: data.amountRequested,
      description: data.description || "",
      paymentMethod: JSON.stringify(data.paymentMethods),
      priority: data.priority,
      dueDate: data.dueDate || null,
    };

    createPaymentMutation.mutate(payload);
  };



  return (
    <AdvancedPermissionGuard permission="payments.modal.create">
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Create Payment Request - {workOrder?.workOrderNumber || "Unknown"}
          </DialogTitle>
          <DialogDescription>
            Request payment from a technician for work completed on this work order.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Technician Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Select Technician</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="technicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technician</FormLabel>
                      <Select onValueChange={handleTechnicianChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a technician" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(technicians as any[]).map((technician) => (
                            <SelectItem key={technician.id} value={technician.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
                                    {technician.firstName?.[0]}{technician.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{technician.firstName} {technician.lastName}</span>
                                <Badge variant="outline" className="ml-2">
                                  ${technician.hourlyRate}/hr
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Technician Details */}
                {selectedTechnician && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {selectedTechnician.firstName?.[0]}{selectedTechnician.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-lg">{selectedTechnician.firstName} {selectedTechnician.lastName}</div>
                          <div className="text-sm text-gray-600 font-normal">{selectedTechnician.specialization}</div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{selectedTechnician.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{selectedTechnician.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{selectedTechnician.location || "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{selectedTechnician.averageRating || "0"}/5 ({selectedTechnician.totalRatings || 0} reviews)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Payment Methods */}
              {selectedTechnician && availablePaymentMethods.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <h3 className="text-lg font-semibold">Available Payment Methods</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="paymentMethods"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {availablePaymentMethods.map((method: string) => {
                            const methodInfo = paymentMethodsInfo[method as keyof typeof paymentMethodsInfo];
                            if (!methodInfo) return null;

                            return (
                              <Card 
                                key={method} 
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  selectedPaymentMethods.includes(method) 
                                    ? methodInfo.color + " border-2" 
                                    : "border hover:border-gray-300"
                                }`}
                                onClick={(e) => {
                                  // Prevent double triggering when clicking the checkbox
                                  if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                                  handlePaymentMethodToggle(method, !selectedPaymentMethods.includes(method));
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={selectedPaymentMethods.includes(method)}
                                      onCheckedChange={(checked) => handlePaymentMethodToggle(method, checked === true)}
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        {methodInfo.icon}
                                        <h4 className="font-semibold">{methodInfo.name}</h4>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-3">{methodInfo.description}</p>
                                      
                                      {/* Payment Details */}
                                      {selectedPaymentMethods.includes(method) && paymentDetails[method] && (
                                        <div className="bg-white rounded-lg p-3 border mt-3">
                                          <h5 className="font-medium text-sm mb-2">Payment Details:</h5>
                                          <div className="space-y-1 text-xs">
                                            {Object.entries(paymentDetails[method] as Record<string, any>).map(([key, value]) => (
                                              <div key={key} className="flex justify-between">
                                                <span className="text-gray-600">{key}:</span>
                                                <span className="font-mono">{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Features */}
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {methodInfo.features.map((feature, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {feature}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amountRequested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Requested</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input {...field} placeholder="0.00" className="pl-10" type="number" step="0.01" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Additional details about the payment request..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* W9 Blocking Warning */}
              {w9Blocked && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">W9 Required — Payment Blocked</p>
                    <p className="text-sm text-red-600 mt-1">
                      Payments of <span className="font-semibold">$500 or more</span> require the technician to have a W9 on file. 
                      {" "}<span className="font-semibold">{selectedTechnician?.firstName} {selectedTechnician?.lastName}</span> does not have a submitted W9 yet.
                    </p>
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Please upload a W9 for this technician in the Technician profile first, then retry.
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <ButtonGuard buttonType="create">
                  <Button 
                    type="submit" 
                    disabled={createPaymentMutation.isPending || w9Blocked}
                    className={w9Blocked ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
                    title={w9Blocked ? "W9 required for payments $500 or more" : undefined}
                  >
                    {createPaymentMutation.isPending ? "Creating..." : "Create Payment Request"}
                  </Button>
                </ButtonGuard>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
      </Dialog>
    </AdvancedPermissionGuard>
  );
}