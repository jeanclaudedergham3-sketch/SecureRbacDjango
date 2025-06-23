import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Technician } from "@shared/schema";

interface CreateTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: Technician | null;
}

interface PaymentMethodDetails {
  paypal?: { link: string; qrCode: string };
  credit_card?: { cardholderName: string; cardNumber: string; expiryDate: string };
  bank_transfer?: { iban: string; bankName: string; accountName: string };
  cash?: {};
}

export function CreateTechnicianModal({ isOpen, onClose, technician }: CreateTechnicianModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    address: "",
    latitude: "",
    longitude: "",
    taxNumber: "",
    specialties: "",
    certifications: "",
    hourlyRate: "",
    status: "available",
  });

  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentMethodDetails>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (technician) {
      setFormData({
        name: technician.name || "",
        phoneNumber: technician.phoneNumber || "",
        email: technician.email || "",
        address: technician.address || "",
        latitude: technician.latitude || "",
        longitude: technician.longitude || "",
        taxNumber: technician.taxNumber || "",
        specialties: technician.specialties || "",
        certifications: technician.certifications || "",
        hourlyRate: technician.hourlyRate || "",
        status: technician.status || "available",
      });
      
      try {
        const methods = technician.paymentMethods ? JSON.parse(technician.paymentMethods) : [];
        const details = technician.paymentDetails ? JSON.parse(technician.paymentDetails) : {};
        setSelectedPaymentMethods(methods);
        setPaymentDetails(details);
      } catch {
        setSelectedPaymentMethods([]);
        setPaymentDetails({});
      }
    } else {
      setFormData({
        name: "",
        phoneNumber: "",
        email: "",
        address: "",
        latitude: "",
        longitude: "",
        taxNumber: "",
        specialties: "",
        certifications: "",
        hourlyRate: "",
        status: "available",
      });
      setSelectedPaymentMethods([]);
      setPaymentDetails({});
    }
  }, [technician, isOpen]);

  const createTechnicianMutation = useMutation({
    mutationFn: (data: any) => 
      technician 
        ? apiRequest("PUT", `/api/technicians/${technician.id}`, data)
        : apiRequest("POST", "/api/technicians", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({
        title: "Success",
        description: technician ? "Technician updated successfully" : "Technician created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save technician",
        variant: "destructive",
      });
    },
  });

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentMethods(prev => [...prev, method]);
      // Initialize empty details for this method
      if (!paymentDetails[method]) {
        setPaymentDetails(prev => ({
          ...prev,
          [method]: method === "cash" ? {} : {}
        }));
      }
    } else {
      setSelectedPaymentMethods(prev => prev.filter(m => m !== method));
      // Remove details for this method
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      paymentMethods: JSON.stringify(selectedPaymentMethods),
      paymentDetails: JSON.stringify(paymentDetails),
    };

    createTechnicianMutation.mutate(submitData);
  };

  const paymentMethodOptions = [
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
      value: "cash", 
      label: "Cash Payment", 
      icon: "💵",
      description: "Cash payments accepted on-site",
      features: ["No processing fees", "Immediate payment", "Receipt provided"]
    },
    { 
      value: "venmo", 
      label: "Venmo", 
      icon: "📲",
      description: "Popular peer-to-peer payment app",
      features: ["Social payments", "Instant transfers", "Mobile-first"]
    },
    { 
      value: "cashapp", 
      label: "Cash App", 
      icon: "💸",
      description: "Square's mobile payment service",
      features: ["Bitcoin support", "Stock investing", "Direct deposit"]
    },
    { 
      value: "zelle", 
      label: "Zelle", 
      icon: "⚡",
      description: "Bank-to-bank transfers in minutes",
      features: ["Direct bank integration", "Fast transfers", "No fees"]
    },
    { 
      value: "crypto", 
      label: "Cryptocurrency", 
      icon: "₿",
      description: "Bitcoin, Ethereum, and other cryptocurrencies",
      features: ["Decentralized", "Global payments", "Low transaction fees"]
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{technician ? "Edit Technician" : "Add New Technician"}</DialogTitle>
          <DialogDescription>
            {technician ? "Update technician information and payment methods." : "Enter technician details and configure payment methods."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+1-555-0123"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter full address"
              rows={2}
            />
          </div>

          {/* Location Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="37.7749"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="-122.4194"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="taxNumber">Tax Number</Label>
            <Input
              id="taxNumber"
              value={formData.taxNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
              placeholder="TAX123456"
            />
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialties">Specialties</Label>
              <Textarea
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="HVAC, Electrical, Plumbing..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="certifications">Certifications</Label>
              <Textarea
                id="certifications"
                value={formData.certifications}
                onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                placeholder="EPA, OSHA, Trade licenses..."
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                placeholder="50.00"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>



          {/* Payment Methods */}
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Payment Methods
              </CardTitle>
              <p className="text-sm text-gray-600">Configure payment methods this technician accepts</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {paymentMethodOptions.map((option) => (
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
                      {option.features && option.features.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {option.features.map((feature, index) => (
                            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic fields based on payment method */}
                  {selectedPaymentMethods.includes(option.value) && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-blue-500">
                      {option.value === "paypal" && (
                        <>
                          <div>
                            <Label>PayPal Link</Label>
                            <Input
                              value={paymentDetails.paypal?.link || ""}
                              onChange={(e) => handlePaymentDetailChange("paypal", "link", e.target.value)}
                              placeholder="https://paypal.me/username"
                            />
                          </div>
                          <div>
                            <Label>QR Code URL</Label>
                            <Input
                              value={paymentDetails.paypal?.qrCode || ""}
                              onChange={(e) => handlePaymentDetailChange("paypal", "qrCode", e.target.value)}
                              placeholder="Upload QR code image URL"
                            />
                          </div>
                        </>
                      )}

                      {option.value === "credit_card" && (
                        <>
                          <div>
                            <Label>Cardholder Name</Label>
                            <Input
                              value={paymentDetails.credit_card?.cardholderName || ""}
                              onChange={(e) => handlePaymentDetailChange("credit_card", "cardholderName", e.target.value)}
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <Label>Card Number</Label>
                            <Input
                              value={paymentDetails.credit_card?.cardNumber || ""}
                              onChange={(e) => handlePaymentDetailChange("credit_card", "cardNumber", e.target.value)}
                              placeholder="**** **** **** 1234"
                            />
                          </div>
                          <div>
                            <Label>Expiry Date</Label>
                            <Input
                              value={paymentDetails.credit_card?.expiryDate || ""}
                              onChange={(e) => handlePaymentDetailChange("credit_card", "expiryDate", e.target.value)}
                              placeholder="MM/YY"
                            />
                          </div>
                        </>
                      )}

                      {option.value === "bank_transfer" && (
                        <>
                          <div>
                            <Label>IBAN</Label>
                            <Input
                              value={paymentDetails.bank_transfer?.iban || ""}
                              onChange={(e) => handlePaymentDetailChange("bank_transfer", "iban", e.target.value)}
                              placeholder="GB82 WEST 1234 5698 7654 32"
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
                          <div>
                            <Label>Account Name</Label>
                            <Input
                              value={paymentDetails.bank_transfer?.accountName || ""}
                              onChange={(e) => handlePaymentDetailChange("bank_transfer", "accountName", e.target.value)}
                              placeholder="Account Holder Name"
                            />
                          </div>
                        </>
                      )}

                      {option.value === "cash" && (
                        <p className="text-sm text-gray-600">No additional fields required for cash payments.</p>
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
              disabled={createTechnicianMutation.isPending}
            >
              {createTechnicianMutation.isPending 
                ? "Saving..." 
                : technician ? "Update Technician" : "Add Technician"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}