import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Star, User, DollarSign } from "lucide-react";
import type { Technician, WorkOrder } from "@shared/schema";
import { TechnicianMapSelectionModal } from "./technician-map-selection-modal";

const paymentRequestSchema = z.object({
  workOrderId: z.number().min(1, "Work order is required"),
  technicianId: z.number().min(1, "Technician is required"),
  paymentMethod: z.enum(["bank_transfer", "cash", "check", "digital_wallet"]),
  amountRequested: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().optional(),
});

type PaymentRequestFormData = z.infer<typeof paymentRequestSchema>;

interface CreatePaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId?: number;
}

export function CreatePaymentRequestModal({ isOpen, onClose, workOrderId }: CreatePaymentRequestModalProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [showMapSelection, setShowMapSelection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const form = useForm<PaymentRequestFormData>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      workOrderId: workOrderId || 0,
      technicianId: 0,
      paymentMethod: "bank_transfer",
      amountRequested: "",
      description: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentRequestFormData) => 
      apiRequest("POST", "/api/payments", {
        ...data,
        amountRequested: parseFloat(data.amountRequested),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment request created successfully",
      });
      onClose();
      form.reset();
      setSelectedTechnician(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PaymentRequestFormData) => {
    createPaymentMutation.mutate(data);
  };

  const handleTechnicianSelect = (technician: Technician) => {
    setSelectedTechnician(technician);
    form.setValue("technicianId", technician.id);
    setShowMapSelection(false);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getWorkOrderDisplay = (workOrderId: number) => {
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    return workOrder ? `${workOrder.workOrderNumber} - ${workOrder.clientName}` : `Work Order #${workOrderId}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Payment Request</DialogTitle>
            <DialogDescription>
              Create a new payment request for technician services
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Work Order Selection */}
              <FormField
                control={form.control}
                name="workOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workOrders.map((workOrder) => (
                          <SelectItem key={workOrder.id} value={workOrder.id.toString()}>
                            {workOrder.workOrderNumber} - {workOrder.clientName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Technician Selection */}
              <div className="space-y-3">
                <FormLabel>Technician</FormLabel>
                
                {selectedTechnician ? (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {selectedTechnician.firstName?.[0] || 'T'}{selectedTechnician.lastName?.[0] || 'T'}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {selectedTechnician.firstName || 'Unknown'} {selectedTechnician.lastName || 'Technician'}
                          </h4>
                          <p className="text-sm text-gray-600">{selectedTechnician.specialization}</p>
                          {selectedTechnician.averageRating && (
                            <div className="flex items-center mt-1">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="text-sm">{selectedTechnician.averageRating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTechnician(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Technician List Selection */}
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {technicians.length > 0 ? technicians.map((technician) => (
                        <div
                          key={technician.id}
                          className="p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleTechnicianSelect(technician)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {technician.firstName?.[0] || 'T'}{technician.lastName?.[0] || 'T'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">
                                  {technician.firstName || 'Unknown'} {technician.lastName || 'Technician'}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    technician.status === 'available' ? 'border-green-200 text-green-700' :
                                    technician.status === 'busy' ? 'border-red-200 text-red-700' : 
                                    'border-gray-200 text-gray-700'
                                  }
                                >
                                  {technician.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">{technician.specialization}</p>
                              {technician.averageRating && (
                                <div className="flex items-center mt-1">
                                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                  <span className="text-xs">{technician.averageRating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500 text-center py-4">No technicians available</p>
                      )}
                    </div>

                    {/* Map Selection Button */}
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowMapSelection(true)}
                        className="w-full"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Select from Map
                      </Button>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="technicianId"
                  render={() => (
                    <FormMessage />
                  )}
                />
              </div>

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    {field.value && (
                      <p className="text-sm text-gray-600">
                        Amount: {formatCurrency(field.value)}
                      </p>
                    )}
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
                        placeholder="Additional notes or description for this payment request..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPaymentMutation.isPending || !selectedTechnician}
                >
                  {createPaymentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Create Payment Request
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Map Selection Modal */}
      <TechnicianMapSelectionModal
        isOpen={showMapSelection}
        onClose={() => setShowMapSelection(false)}
        onSelect={handleTechnicianSelect}
        technicians={technicians}
      />
    </>
  );
}