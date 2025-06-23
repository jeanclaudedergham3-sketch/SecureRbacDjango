import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    firstName: "",
    lastName: "",
    bankAccount: "",
    routingNumber: "",
    bankName: "",
    paypalEmail: "",
    paypalLink: "",
    venmoHandle: "",
    cashappHandle: "",
    zelleInfo: "",
    mailingAddress: "",
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
        firstName: technician.firstName || "",
        lastName: technician.lastName || "",
        bankAccount: technician.bankAccount || "",
        routingNumber: technician.routingNumber || "",
        bankName: technician.bankName || "",
        paypalEmail: technician.paypalEmail || "",
        paypalLink: technician.paypalLink || "",
        venmoHandle: technician.venmoHandle || "",
        cashappHandle: technician.cashappHandle || "",
        zelleInfo: technician.zelleInfo || "",
        mailingAddress: technician.mailingAddress || "",
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
        firstName: "",
        lastName: "",
        bankAccount: "",
        routingNumber: "",
        bankName: "",
        paypalEmail: "",
        paypalLink: "",
        venmoHandle: "",
        cashappHandle: "",
        zelleInfo: "",
        mailingAddress: "",
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
    { value: "paypal", label: "PayPal" },
    { value: "credit_card", label: "Credit Card" },
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
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
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="HVAC, Electrical, Plumbing"
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                placeholder="75"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="certifications">Certifications</Label>
            <Textarea
              id="certifications"
              value={formData.certifications}
              onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
              placeholder="EPA Certified, Licensed Electrician, etc."
              rows={2}
            />
          </div>

          {/* Payment Account Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="Account number"
              />
            </div>
            <div>
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={formData.paypalEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, paypalEmail: e.target.value }))}
                placeholder="paypal@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="venmoHandle">Venmo Handle</Label>
              <Input
                id="venmoHandle"
                value={formData.venmoHandle}
                onChange={(e) => setFormData(prev => ({ ...prev, venmoHandle: e.target.value }))}
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="cashappHandle">CashApp Handle</Label>
              <Input
                id="cashappHandle"
                value={formData.cashappHandle}
                onChange={(e) => setFormData(prev => ({ ...prev, cashappHandle: e.target.value }))}
                placeholder="$username"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethodOptions.map((option) => (
                <div key={option.value} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={selectedPaymentMethods.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handlePaymentMethodChange(option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={option.value} className="font-medium">
                      {option.label}
                    </Label>
                  </div>

                  {/* Dynamic fields based on payment method */}
                  {selectedPaymentMethods.includes(option.value) && (
                    <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-md">
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