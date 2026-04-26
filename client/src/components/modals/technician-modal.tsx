import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Star, CreditCard, FileText, Upload, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Technician } from "@shared/schema";

const technicianSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  specialization: z.string().min(1, "Specialization is required"),
  experience: z.string().min(1, "Experience is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  location: z.string().optional(),
  availability: z.enum(["available", "busy", "unavailable"]),
  paymentMethods: z.array(z.string()).optional(),
  // Payment details
  paypalEmail: z.string().optional(),
  bankAccount: z.string().optional(),
  venmoHandle: z.string().optional(),
  cashappHandle: z.string().optional(),
  zelleInfo: z.string().optional(),
  mailingAddress: z.string().optional(),
});

type TechnicianFormData = z.infer<typeof technicianSchema>;

interface TechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  initialData?: Technician | null;
  mode: "create" | "edit";
}

const availablePaymentMethods = [
  { id: "paypal", label: "PayPal" },
  { id: "credit_card", label: "Credit Card" },
  { id: "cash", label: "Cash" },
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "venmo", label: "Venmo" },
  { id: "cashapp", label: "Cash App" },
  { id: "zelle", label: "Zelle" },
  { id: "check", label: "Check" },
];

export function TechnicianModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData,
  mode,
}: TechnicianModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<{[key: string]: string}>({});
  const [w9Uploading, setW9Uploading] = useState(false);
  const [w9Deleting, setW9Deleting] = useState(false);
  const [w9Info, setW9Info] = useState<{ fileName: string | null; filePath: string | null; submittedAt: string | null } | null>(null);
  const w9FileRef = useRef<HTMLInputElement>(null);

  const form = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialization: "",
      experience: "",
      hourlyRate: "",
      location: "",
      availability: "available",
      paymentMethods: [],
      // Payment details
      paypalEmail: "",
      bankAccount: "",
      venmoHandle: "",
      cashappHandle: "",
      zelleInfo: "",
      mailingAddress: "",
    },
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        // Parse payment methods if they exist
        let paymentMethods: string[] = [];
        if (initialData.paymentMethods) {
          try {
            if (typeof initialData.paymentMethods === 'string') {
              if (initialData.paymentMethods.startsWith('[')) {
                paymentMethods = JSON.parse(initialData.paymentMethods);
              } else {
                paymentMethods = initialData.paymentMethods.split(',').map(m => m.trim());
              }
            } else {
              paymentMethods = initialData.paymentMethods as string[];
            }
          } catch (error) {
            console.error('Error parsing payment methods:', error);
            paymentMethods = [];
          }
        }

        form.reset({
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          specialization: initialData.specialization || "",
          experience: initialData.experience?.toString() || "",
          hourlyRate: initialData.hourlyRate?.toString() || "",
          location: initialData.location || "",
          availability: initialData.availability || "available",
          paymentMethods: paymentMethods,
          // Payment details
          paypalEmail: initialData.paypalEmail || "",
          bankAccount: initialData.bankAccount || "",
          venmoHandle: initialData.venmoHandle || "",
          cashappHandle: initialData.cashappHandle || "",
          zelleInfo: initialData.zelleInfo || "",
          mailingAddress: initialData.mailingAddress || "",
        });
        setSelectedPaymentMethods(paymentMethods);
        // Set W9 info
        setW9Info({
          fileName: (initialData as any).w9FileName || null,
          filePath: (initialData as any).w9FilePath || null,
          submittedAt: (initialData as any).w9SubmittedAt || null,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          specialization: "",
          experience: "",
          hourlyRate: "",
          location: "",
          availability: "available",
          paymentMethods: [],
          // Payment details
          paypalEmail: "",
          bankAccount: "",
          venmoHandle: "",
          cashappHandle: "",
          zelleInfo: "",
          mailingAddress: "",
        });
        setSelectedPaymentMethods([]);
        setW9Info(null);
      }
    }
  }, [isOpen, mode, initialData, form]);

  const handleW9Upload = async (file: File) => {
    if (!initialData?.id) return;
    setW9Uploading(true);
    try {
      const formData = new FormData();
      formData.append('w9', file);
      const response = await fetch(`/api/technicians/${initialData.id}/w9`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Upload failed');
      }
      const result = await response.json();
      const tech = result.technician;
      setW9Info({
        fileName: tech.w9FileName,
        filePath: tech.w9FilePath,
        submittedAt: tech.w9SubmittedAt,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      toast({ title: "W9 Uploaded", description: "W9 document uploaded successfully." });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setW9Uploading(false);
      if (w9FileRef.current) w9FileRef.current.value = '';
    }
  };

  const handleW9Delete = async () => {
    if (!initialData?.id) return;
    setW9Deleting(true);
    try {
      const response = await fetch(`/api/technicians/${initialData.id}/w9`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Delete failed');
      }
      setW9Info(null);
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      toast({ title: "W9 Removed", description: "W9 document removed successfully." });
    } catch (error: any) {
      toast({ title: "Remove Failed", description: error.message, variant: "destructive" });
    } finally {
      setW9Deleting(false);
    }
  };

  const handlePaymentMethodChange = (methodId: string, checked: boolean) => {
    const newMethods = checked
      ? [...selectedPaymentMethods, methodId]
      : selectedPaymentMethods.filter(id => id !== methodId);
    
    setSelectedPaymentMethods(newMethods);
    form.setValue("paymentMethods", newMethods);
  };

  const handleSubmit = async (data: TechnicianFormData) => {
    let processedData = {
      ...data,
      experience: parseInt(data.experience),
      hourlyRate: data.hourlyRate, // Keep as string - database expects decimal as string
      paymentMethods: selectedPaymentMethods.join(','), // Convert array to comma-separated string
    };

    // If location is provided and we don't have coordinates, try to geocode
    if (data.location && data.location.trim() && (!initialData?.latitude || !initialData?.longitude)) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.location.trim())}&limit=1&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'TechnicianApp/1.0'
            }
          }
        );
        
        if (response.ok) {
          const results = await response.json();
          if (results && results.length > 0) {
            processedData = {
              ...processedData,
              latitude: results[0].lat,
              longitude: results[0].lon
            };
          }
        }
      } catch (error) {
        console.warn('Geocoding failed, continuing without coordinates:', error);
      }
    }

    onSubmit(processedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === "edit" ? "Edit Technician" : "Add New Technician"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="john.doe@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City, State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="HVAC, Plumbing, Electrical, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience (Years)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="75.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Methods & Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Select Payment Methods</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availablePaymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={method.id}
                          checked={selectedPaymentMethods.includes(method.id)}
                          onCheckedChange={(checked) => 
                            handlePaymentMethodChange(method.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={method.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {method.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                {selectedPaymentMethods.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700">Payment Details</h4>
                    
                    {selectedPaymentMethods.includes('paypal') && (
                      <FormField
                        control={form.control}
                        name="paypalEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PayPal Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="paypal@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {(selectedPaymentMethods.includes('credit_card') || selectedPaymentMethods.includes('bank_transfer')) && (
                      <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Account / Routing Info</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Bank account or routing information" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedPaymentMethods.includes('venmo') && (
                      <FormField
                        control={form.control}
                        name="venmoHandle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venmo Handle</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="@venmo-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedPaymentMethods.includes('cashapp') && (
                      <FormField
                        control={form.control}
                        name="cashappHandle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cash App Handle</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="$cashapp-handle" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedPaymentMethods.includes('zelle') && (
                      <FormField
                        control={form.control}
                        name="zelleInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zelle Email/Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="zelle@example.com or phone number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedPaymentMethods.includes('check') && (
                      <FormField
                        control={form.control}
                        name="mailingAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mailing Address for Checks</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Full mailing address for check payments" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* W9 Document — only shown when editing an existing technician */}
            {mode === "edit" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    W9 Tax Document
                    {w9Info?.filePath ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" /> On File
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50">
                        <AlertCircle className="h-3 w-3 mr-1" /> Not on File
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {w9Info?.filePath ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{w9Info.fileName || "W9 Document"}</p>
                          {w9Info.submittedAt && (
                            <p className="text-xs text-green-600">
                              Uploaded {new Date(w9Info.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(w9Info.filePath!, '_blank')}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          onClick={handleW9Delete}
                          disabled={w9Deleting}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {w9Deleting ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        No W9 on file. Payments over $500 will be blocked until a W9 is uploaded.
                      </p>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        onClick={() => w9FileRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">Click to upload W9</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC, DOCX — max 10MB</p>
                      </div>
                    </div>
                  )}
                  {/* Hidden file input */}
                  <input
                    ref={w9FileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleW9Upload(file);
                    }}
                  />
                  {w9Uploading && (
                    <p className="text-sm text-blue-600 flex items-center gap-2">
                      <Upload className="h-4 w-4 animate-bounce" /> Uploading W9…
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Processing..." : mode === "edit" ? "Update Technician" : "Add Technician"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}