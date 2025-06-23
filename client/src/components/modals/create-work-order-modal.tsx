import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrderWithUsers, User } from "@shared/schema";

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers | null;
}

export function CreateWorkOrderModal({ isOpen, onClose, workOrder }: CreateWorkOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    country: "",
    city: "",
    street: "",
    zipCode: "",
    description: "",
    urgency: "medium",
    equipmentType: "",
    problemDescription: "",
    nte: "",
    tnte: "",
    startDate: "",
    endDate: "",
    estimatedHours: "",
    specialInstructions: "",
    accessInstructions: "",
    safetyRequirements: "",
    assignedUserIds: [] as number[],
    status: "active",
  });

  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any>({});

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (workOrder) {
      setFormData({
        clientName: workOrder.clientName || "",
        clientPhone: workOrder.clientPhone || "",
        clientEmail: workOrder.clientEmail || "",
        country: workOrder.country || "",
        city: workOrder.city || "",
        street: workOrder.street || "",
        zipCode: workOrder.zipCode || "",
        description: workOrder.description || "",
        urgency: workOrder.urgency || "medium",
        equipmentType: workOrder.equipmentType || "",
        problemDescription: workOrder.problemDescription || "",
        nte: workOrder.nte || "",
        tnte: workOrder.tnte || "",
        startDate: workOrder.startDate ? new Date(workOrder.startDate).toISOString().split('T')[0] : "",
        endDate: workOrder.endDate ? new Date(workOrder.endDate).toISOString().split('T')[0] : "",
        estimatedHours: workOrder.estimatedHours || "",
        specialInstructions: workOrder.specialInstructions || "",
        accessInstructions: workOrder.accessInstructions || "",
        safetyRequirements: workOrder.safetyRequirements || "",
        assignedUserIds: workOrder.assignedUsers?.map(user => user.id) || [],
        status: workOrder.status || "active",
      });
      
      try {
        const methods = workOrder.paymentMethods ? JSON.parse(workOrder.paymentMethods) : [];
        const details = workOrder.paymentDetails ? JSON.parse(workOrder.paymentDetails) : {};
        setSelectedPaymentMethods(methods);
        setPaymentDetails(details);
      } catch {
        setSelectedPaymentMethods([]);
        setPaymentDetails({});
      }
    } else {
      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        country: "",
        city: "",
        street: "",
        zipCode: "",
        description: "",
        urgency: "medium",
        equipmentType: "",
        problemDescription: "",
        nte: "",
        tnte: "",
        startDate: "",
        endDate: "",
        estimatedHours: "",
        specialInstructions: "",
        accessInstructions: "",
        safetyRequirements: "",
        assignedUserIds: [],
        status: "active",
      });
      setSelectedPaymentMethods([]);
      setPaymentDetails({});
    }
  }, [workOrder, isOpen]);

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentMethods(prev => [...prev, method]);
      if (!paymentDetails[method]) {
        setPaymentDetails(prev => ({
          ...prev,
          [method]: method === "cash" ? {} : {}
        }));
      }
    } else {
      setSelectedPaymentMethods(prev => prev.filter(m => m !== method));
      const newDetails = { ...paymentDetails };
      delete newDetails[method];
      setPaymentDetails(newDetails);
    }
  };

  const handlePaymentDetailChange = (method: string, field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value
      }
    }));
  };

  const createWorkOrderMutation = useMutation({
    mutationFn: (data: any) => 
      workOrder 
        ? apiRequest("PUT", `/api/work-orders/${workOrder.id}`, data)
        : apiRequest("POST", "/api/work-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: workOrder ? "Work order updated successfully" : "Work order created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save work order",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.clientName.trim() || !formData.country.trim() || !formData.city.trim() || 
        !formData.street.trim() || !formData.description.trim() || !formData.nte.trim() || !formData.tnte.trim() ||
        !formData.startDate || !formData.endDate || formData.assignedUserIds.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and assign at least one user",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      assignedUserIds: JSON.stringify(formData.assignedUserIds),
      paymentMethods: JSON.stringify(selectedPaymentMethods),
      paymentDetails: JSON.stringify(paymentDetails),
      startDate: formData.startDate,
      endDate: formData.endDate,
    };

    createWorkOrderMutation.mutate(submitData, {
      onSuccess: () => {
        // Force refresh of work orders list
        queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workOrder ? "Edit Work Order" : "Create New Work Order"}</DialogTitle>
          <DialogDescription>
            {workOrder ? "Update work order information and details." : "Enter work order details and assign to a user."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="+1-555-0123"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <Label htmlFor="street">Street *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Street address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Work Details</h3>
            
            <div>
              <Label htmlFor="description">Work Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the work to be performed..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="equipmentType">Equipment Type</Label>
                <Input
                  id="equipmentType"
                  value={formData.equipmentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipmentType: e.target.value }))}
                  placeholder="HVAC, Electrical, Plumbing..."
                />
              </div>
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  placeholder="8.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="problemDescription">Problem Description</Label>
              <Textarea
                id="problemDescription"
                value={formData.problemDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, problemDescription: e.target.value }))}
                placeholder="Detailed description of the problem or issue..."
                rows={2}
              />
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Instructions & Requirements</h3>
            
            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                placeholder="Any special instructions for the technician..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="accessInstructions">Access Instructions</Label>
              <Textarea
                id="accessInstructions"
                value={formData.accessInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, accessInstructions: e.target.value }))}
                placeholder="How to access the site, key codes, contact person..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="safetyRequirements">Safety Requirements</Label>
              <Textarea
                id="safetyRequirements"
                value={formData.safetyRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, safetyRequirements: e.target.value }))}
                placeholder="PPE requirements, safety protocols, hazards to be aware of..."
                rows={2}
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financial Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nte">NTE (without tax) *</Label>
                <Input
                  id="nte"
                  type="number"
                  step="0.01"
                  value={formData.nte}
                  onChange={(e) => setFormData(prev => ({ ...prev, nte: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="tnte">TNTE (including tax) *</Label>
                <Input
                  id="tnte"
                  type="number"
                  step="0.01"
                  value={formData.tnte}
                  onChange={(e) => setFormData(prev => ({ ...prev, tnte: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Project Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Project Timeline</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Assigned Users * (Select multiple users)</Label>
                <Card className="mt-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Selected Users ({formData.assignedUserIds.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {formData.assignedUserIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.assignedUserIds.map((userId) => {
                          const user = users.find(u => u.id === userId);
                          return user ? (
                            <div key={userId} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                              <span>{user.firstName} {user.lastName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    assignedUserIds: prev.assignedUserIds.filter(id => id !== userId)
                                  }));
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No users selected</p>
                    )}
                    
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="text-sm font-medium">Available Users:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {users.filter(user => !formData.assignedUserIds.includes(user.id)).map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    assignedUserIds: [...prev.assignedUserIds, user.id]
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer">
                              {user.firstName} {user.lastName} ({user.username})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Accepted Payment Methods
              </CardTitle>
              <p className="text-sm text-gray-600">Configure which payment methods clients can use for this work order</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {[
                { 
                  value: "paypal", 
                  label: "PayPal", 
                  icon: "💳",
                  description: "Secure online payments via PayPal",
                  features: ["Instant transfers", "Buyer protection", "Mobile payments"]
                },
                { 
                  value: "credit_card", 
                  label: "Credit/Debit Cards", 
                  icon: "💎",
                  description: "Accept all major credit and debit cards",
                  features: ["Visa, MasterCard, Amex", "Secure processing", "Real-time approval"]
                },
                { 
                  value: "bank_transfer", 
                  label: "Bank Transfer", 
                  icon: "🏦",
                  description: "Direct bank-to-bank transfers",
                  features: ["ACH transfers", "Wire transfers", "Lower fees"]
                },
                { 
                  value: "digital_wallet", 
                  label: "Digital Wallets", 
                  icon: "📱",
                  description: "Apple Pay, Google Pay, Samsung Pay",
                  features: ["Contactless payments", "Biometric security", "Quick checkout"]
                },
                { 
                  value: "cryptocurrency", 
                  label: "Cryptocurrency", 
                  icon: "₿",
                  description: "Bitcoin, Ethereum, and other cryptocurrencies",
                  features: ["Decentralized", "Global payments", "Low transaction fees"]
                },
                { 
                  value: "financing", 
                  label: "Financing Options", 
                  icon: "📊",
                  description: "Payment plans and financing solutions",
                  features: ["Installment plans", "0% APR options", "Credit checks"]
                },
                { 
                  value: "cash", 
                  label: "Cash Payment", 
                  icon: "💵",
                  description: "Cash payments accepted on-site",
                  features: ["No processing fees", "Immediate payment", "Receipt provided"]
                },
                { 
                  value: "check", 
                  label: "Check Payment", 
                  icon: "📝",
                  description: "Personal or business checks",
                  features: ["Traditional payment", "Paper trail", "Business accounting"]
                },
              ].map((option) => (
                <div key={option.value} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={option.value}
                      checked={selectedPaymentMethods.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handlePaymentMethodChange(option.value, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{option.icon}</span>
                        <Label htmlFor={option.value} className="font-semibold text-lg cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {option.features.map((feature, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic fields based on payment method */}
                  {selectedPaymentMethods.includes(option.value) && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-blue-500">
                      {option.value === "paypal" && (
                        <>
                          <div>
                            <Label>PayPal Email</Label>
                            <Input
                              value={paymentDetails.paypal?.email || ""}
                              onChange={(e) => handlePaymentDetailChange("paypal", "email", e.target.value)}
                              placeholder="payments@company.com"
                            />
                          </div>
                          <div>
                            <Label>PayPal Link</Label>
                            <Input
                              value={paymentDetails.paypal?.link || ""}
                              onChange={(e) => handlePaymentDetailChange("paypal", "link", e.target.value)}
                              placeholder="https://paypal.me/company"
                            />
                          </div>
                        </>
                      )}

                      {option.value === "credit_card" && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Payment Processor</Label>
                              <Input
                                value={paymentDetails.credit_card?.processor || ""}
                                onChange={(e) => handlePaymentDetailChange("credit_card", "processor", e.target.value)}
                                placeholder="Stripe, Square, PayPal, etc."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Processing Fee %</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={paymentDetails.credit_card?.processingFee || ""}
                                onChange={(e) => handlePaymentDetailChange("credit_card", "processingFee", e.target.value)}
                                placeholder="2.9"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Accepted Card Types</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {["Visa", "MasterCard", "American Express", "Discover", "Diners Club", "JCB"].map((card) => (
                                <label key={card} className="flex items-center space-x-2 text-sm">
                                  <Checkbox
                                    checked={(paymentDetails.credit_card?.acceptedCards || "").includes(card)}
                                    onCheckedChange={(checked) => {
                                      const current = paymentDetails.credit_card?.acceptedCards || "";
                                      const cards = current.split(", ").filter(Boolean);
                                      if (checked) {
                                        cards.push(card);
                                      } else {
                                        const index = cards.indexOf(card);
                                        if (index > -1) cards.splice(index, 1);
                                      }
                                      handlePaymentDetailChange("credit_card", "acceptedCards", cards.join(", "));
                                    }}
                                  />
                                  <span>{card}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {option.value === "digital_wallet" && (
                        <>
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Supported Digital Wallets</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {["Apple Pay", "Google Pay", "Samsung Pay", "PayPal", "Venmo", "Cash App"].map((wallet) => (
                                <label key={wallet} className="flex items-center space-x-2 text-sm">
                                  <Checkbox
                                    checked={(paymentDetails.digital_wallet?.supportedWallets || "").includes(wallet)}
                                    onCheckedChange={(checked) => {
                                      const current = paymentDetails.digital_wallet?.supportedWallets || "";
                                      const wallets = current.split(", ").filter(Boolean);
                                      if (checked) {
                                        wallets.push(wallet);
                                      } else {
                                        const index = wallets.indexOf(wallet);
                                        if (index > -1) wallets.splice(index, 1);
                                      }
                                      handlePaymentDetailChange("digital_wallet", "supportedWallets", wallets.join(", "));
                                    }}
                                  />
                                  <span>{wallet}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Special Instructions</Label>
                            <Textarea
                              value={paymentDetails.digital_wallet?.instructions || ""}
                              onChange={(e) => handlePaymentDetailChange("digital_wallet", "instructions", e.target.value)}
                              placeholder="QR code available on-site, contactless payments accepted..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </>
                      )}

                      {option.value === "cryptocurrency" && (
                        <>
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Accepted Cryptocurrencies</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {["Bitcoin (BTC)", "Ethereum (ETH)", "Litecoin (LTC)", "Bitcoin Cash (BCH)", "Dogecoin (DOGE)", "USDC"].map((crypto) => (
                                <label key={crypto} className="flex items-center space-x-2 text-sm">
                                  <Checkbox
                                    checked={(paymentDetails.cryptocurrency?.acceptedCoins || "").includes(crypto)}
                                    onCheckedChange={(checked) => {
                                      const current = paymentDetails.cryptocurrency?.acceptedCoins || "";
                                      const coins = current.split(", ").filter(Boolean);
                                      if (checked) {
                                        coins.push(crypto);
                                      } else {
                                        const index = coins.indexOf(crypto);
                                        if (index > -1) coins.splice(index, 1);
                                      }
                                      handlePaymentDetailChange("cryptocurrency", "acceptedCoins", coins.join(", "));
                                    }}
                                  />
                                  <span>{crypto}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Wallet Address (BTC)</Label>
                              <Input
                                value={paymentDetails.cryptocurrency?.btcAddress || ""}
                                onChange={(e) => handlePaymentDetailChange("cryptocurrency", "btcAddress", e.target.value)}
                                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                                className="mt-1 font-mono text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Wallet Address (ETH)</Label>
                              <Input
                                value={paymentDetails.cryptocurrency?.ethAddress || ""}
                                onChange={(e) => handlePaymentDetailChange("cryptocurrency", "ethAddress", e.target.value)}
                                placeholder="0x742d35Cc6634C0532925a3b8D50ad59B7a0f3029"
                                className="mt-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {option.value === "financing" && (
                        <>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Financing Provider</Label>
                                <Input
                                  value={paymentDetails.financing?.provider || ""}
                                  onChange={(e) => handlePaymentDetailChange("financing", "provider", e.target.value)}
                                  placeholder="Affirm, Klarna, PayPal Credit..."
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Minimum Amount</Label>
                                <Input
                                  type="number"
                                  value={paymentDetails.financing?.minimumAmount || ""}
                                  onChange={(e) => handlePaymentDetailChange("financing", "minimumAmount", e.target.value)}
                                  placeholder="1000"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Available Terms</Label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {["3 months", "6 months", "12 months", "18 months", "24 months", "36 months"].map((term) => (
                                  <label key={term} className="flex items-center space-x-2 text-sm">
                                    <Checkbox
                                      checked={(paymentDetails.financing?.availableTerms || "").includes(term)}
                                      onCheckedChange={(checked) => {
                                        const current = paymentDetails.financing?.availableTerms || "";
                                        const terms = current.split(", ").filter(Boolean);
                                        if (checked) {
                                          terms.push(term);
                                        } else {
                                          const index = terms.indexOf(term);
                                          if (index > -1) terms.splice(index, 1);
                                        }
                                        handlePaymentDetailChange("financing", "availableTerms", terms.join(", "));
                                      }}
                                    />
                                    <span>{term}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Special Offers</Label>
                              <Textarea
                                value={paymentDetails.financing?.specialOffers || ""}
                                onChange={(e) => handlePaymentDetailChange("financing", "specialOffers", e.target.value)}
                                placeholder="0% APR for 12 months, No credit check required for amounts under $500..."
                                rows={2}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {option.value === "bank_transfer" && (
                        <>
                          <div>
                            <Label>Account Number</Label>
                            <Input
                              value={paymentDetails.bank_transfer?.accountNumber || ""}
                              onChange={(e) => handlePaymentDetailChange("bank_transfer", "accountNumber", e.target.value)}
                              placeholder="Account number"
                            />
                          </div>
                          <div>
                            <Label>Routing Number</Label>
                            <Input
                              value={paymentDetails.bank_transfer?.routingNumber || ""}
                              onChange={(e) => handlePaymentDetailChange("bank_transfer", "routingNumber", e.target.value)}
                              placeholder="Routing number"
                            />
                          </div>
                          <div>
                            <Label>Bank Name</Label>
                            <Input
                              value={paymentDetails.bank_transfer?.bankName || ""}
                              onChange={(e) => handlePaymentDetailChange("bank_transfer", "bankName", e.target.value)}
                              placeholder="Bank Name"
                            />
                          </div>
                        </>
                      )}

                      {option.value === "check" && (
                        <>
                          <div>
                            <Label>Make Checks Payable To</Label>
                            <Input
                              value={paymentDetails.check?.payableTo || ""}
                              onChange={(e) => handlePaymentDetailChange("check", "payableTo", e.target.value)}
                              placeholder="Company Name"
                            />
                          </div>
                          <div>
                            <Label>Mailing Address</Label>
                            <Textarea
                              value={paymentDetails.check?.mailingAddress || ""}
                              onChange={(e) => handlePaymentDetailChange("check", "mailingAddress", e.target.value)}
                              placeholder="Complete mailing address for checks"
                              rows={2}
                            />
                          </div>
                        </>
                      )}

                      {option.value === "cash" && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Cash Payment Instructions</Label>
                            <Textarea
                              value={paymentDetails.cash?.instructions || ""}
                              onChange={(e) => handlePaymentDetailChange("cash", "instructions", e.target.value)}
                              placeholder="Payment due upon completion. Exact change appreciated. Receipt will be provided..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center space-x-2 text-sm">
                              <Checkbox
                                checked={paymentDetails.cash?.makeChangeAvailable || false}
                                onCheckedChange={(checked) => handlePaymentDetailChange("cash", "makeChangeAvailable", checked.toString())}
                              />
                              <span>We can make change</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm">
                              <Checkbox
                                checked={paymentDetails.cash?.receiptProvided || false}
                                onCheckedChange={(checked) => handlePaymentDetailChange("cash", "receiptProvided", checked.toString())}
                              />
                              <span>Receipt provided</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createWorkOrderMutation.isPending}
            >
              {createWorkOrderMutation.isPending 
                ? "Saving..." 
                : workOrder ? "Update Work Order" : "Create Work Order"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}