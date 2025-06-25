import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Technician } from "@shared/schema";

interface CreateTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: Technician | null;
}

export function CreateTechnicianModal({ isOpen, onClose, technician }: CreateTechnicianModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state matching database schema
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    location: "",
    latitude: "",
    longitude: "",
    specialization: "",
    experience: 0,
    hourlyRate: "",
    availability: "available",
    // Payment details
    bankAccount: "",
    routingNumber: "",
    bankName: "",
    paypalEmail: "",
    venmoHandle: "",
    cashappHandle: "",
    zelleInfo: "",
    mailingAddress: "",
  });

  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (technician) {
      setFormData({
        firstName: technician.firstName || "",
        lastName: technician.lastName || "",
        phone: technician.phone || "",
        email: technician.email || "",
        location: technician.location || "",
        latitude: technician.latitude || "",
        longitude: technician.longitude || "",
        specialization: technician.specialization || "",
        experience: technician.experience || 0,
        hourlyRate: technician.hourlyRate || "",
        availability: technician.availability || "available",
        // Payment details
        bankAccount: (technician as any).bankAccount || "",
        routingNumber: (technician as any).routingNumber || "",
        bankName: (technician as any).bankName || "",
        paypalEmail: (technician as any).paypalEmail || "",
        venmoHandle: (technician as any).venmoHandle || "",
        cashappHandle: (technician as any).cashappHandle || "",
        zelleInfo: (technician as any).zelleInfo || "",
        mailingAddress: (technician as any).mailingAddress || "",
      });
      
      try {
        const methods = technician.paymentMethods ? JSON.parse(technician.paymentMethods) : [];
        setSelectedPaymentMethods(methods);
      } catch {
        setSelectedPaymentMethods([]);
      }
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        location: "",
        latitude: "",
        longitude: "",
        specialization: "",
        experience: 0,
        hourlyRate: "",
        availability: "available",
        // Payment details
        bankAccount: "",
        routingNumber: "",
        bankName: "",
        paypalEmail: "",
        venmoHandle: "",
        cashappHandle: "",
        zelleInfo: "",
        mailingAddress: "",
      });
      setSelectedPaymentMethods([]);
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
    } else {
      setSelectedPaymentMethods(prev => prev.filter(m => m !== method));
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      toast({
        title: "Error",
        description: "First name, last name, and phone number are required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.specialization.trim() || !formData.location.trim()) {
      toast({
        title: "Error",
        description: "Specialization and location are required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      experience: Number(formData.experience),
      hourlyRate: formData.hourlyRate,
      paymentMethods: JSON.stringify(selectedPaymentMethods),
      // Include payment details
      bankAccount: formData.bankAccount,
      routingNumber: formData.routingNumber,
      bankName: formData.bankName,
      paypalEmail: formData.paypalEmail,
      venmoHandle: formData.venmoHandle,
      cashappHandle: formData.cashappHandle,
      zelleInfo: formData.zelleInfo,
      mailingAddress: formData.mailingAddress,
    };

    createTechnicianMutation.mutate(submitData);
  };

  const paymentMethodOptions = [
    { value: "paypal", label: "PayPal", icon: "💳" },
    { value: "credit_card", label: "Credit/Debit Cards", icon: "💎" },
    { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
    { value: "cash", label: "Cash Payment", icon: "💵" },
    { value: "venmo", label: "Venmo", icon: "📲" },
    { value: "cashapp", label: "Cash App", icon: "💸" },
    { value: "zelle", label: "Zelle", icon: "⚡" },
    { value: "check", label: "Check Payment", icon: "📝" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {technician ? "Edit Technician" : "Add New Technician"}
          </DialogTitle>
          <DialogDescription>
            {technician ? "Update technician information" : "Enter the details for the new technician"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Enter location/address"
            />
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization *</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => handleInputChange("specialization", e.target.value)}
                placeholder="e.g., HVAC, Plumbing, Electrical"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => handleInputChange("experience", parseInt(e.target.value) || 0)}
                placeholder="Enter years of experience"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                placeholder="Enter hourly rate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Select value={formData.availability} onValueChange={(value) => handleInputChange("availability", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GPS Coordinates (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (Optional)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleInputChange("latitude", e.target.value)}
                placeholder="Enter latitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (Optional)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleInputChange("longitude", e.target.value)}
                placeholder="Enter longitude"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Methods
              </CardTitle>
              <DialogDescription>
                Select the payment methods this technician accepts and enter payment details
              </DialogDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {paymentMethodOptions.map((method) => (
                  <div key={method.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={method.value}
                      checked={selectedPaymentMethods.includes(method.value)}
                      onCheckedChange={(checked) => 
                        handlePaymentMethodChange(method.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={method.value} className="flex items-center gap-2 cursor-pointer">
                      <span>{method.icon}</span>
                      <span>{method.label}</span>
                    </Label>
                  </div>
                ))}
              </div>

              {/* Bank Transfer Details */}
              {selectedPaymentMethods.includes("bank_transfer") && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Bank Transfer Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Account Number</Label>
                      <Input
                        id="bankAccount"
                        value={formData.bankAccount}
                        onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                        placeholder="Enter account number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input
                        id="routingNumber"
                        value={formData.routingNumber}
                        onChange={(e) => handleInputChange("routingNumber", e.target.value)}
                        placeholder="Enter routing number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange("bankName", e.target.value)}
                      placeholder="Enter bank name"
                    />
                  </div>
                </div>
              )}

              {/* PayPal Details */}
              {selectedPaymentMethods.includes("paypal") && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">PayPal Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="paypalEmail">PayPal Email</Label>
                    <Input
                      id="paypalEmail"
                      type="email"
                      value={formData.paypalEmail}
                      onChange={(e) => handleInputChange("paypalEmail", e.target.value)}
                      placeholder="Enter PayPal email"
                    />
                  </div>
                </div>
              )}

              {/* Venmo Details */}
              {selectedPaymentMethods.includes("venmo") && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Venmo Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="venmoHandle">Venmo Handle</Label>
                    <Input
                      id="venmoHandle"
                      value={formData.venmoHandle}
                      onChange={(e) => handleInputChange("venmoHandle", e.target.value)}
                      placeholder="Enter Venmo handle (e.g., @username)"
                    />
                  </div>
                </div>
              )}

              {/* Cash App Details */}
              {selectedPaymentMethods.includes("cashapp") && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Cash App Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="cashappHandle">Cash App Handle</Label>
                    <Input
                      id="cashappHandle"
                      value={formData.cashappHandle}
                      onChange={(e) => handleInputChange("cashappHandle", e.target.value)}
                      placeholder="Enter Cash App handle (e.g., $username)"
                    />
                  </div>
                </div>
              )}

              {/* Zelle Details */}
              {selectedPaymentMethods.includes("zelle") && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Zelle Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="zelleInfo">Zelle Email/Phone</Label>
                    <Input
                      id="zelleInfo"
                      value={formData.zelleInfo}
                      onChange={(e) => handleInputChange("zelleInfo", e.target.value)}
                      placeholder="Enter Zelle email or phone number"
                    />
                  </div>
                </div>
              )}

              {/* Mailing Address for Check Payments */}
              {selectedPaymentMethods.includes("check") && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Mailing Address for Checks</h4>
                  <div className="space-y-2">
                    <Label htmlFor="mailingAddress">Mailing Address</Label>
                    <Input
                      id="mailingAddress"
                      value={formData.mailingAddress}
                      onChange={(e) => handleInputChange("mailingAddress", e.target.value)}
                      placeholder="Enter complete mailing address"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTechnicianMutation.isPending}
            >
              {createTechnicianMutation.isPending 
                ? (technician ? "Updating..." : "Creating...") 
                : (technician ? "Update Technician" : "Create Technician")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}