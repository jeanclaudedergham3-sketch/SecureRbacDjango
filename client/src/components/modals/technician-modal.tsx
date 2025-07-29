import { useState, useEffect } from "react";
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
import { User, Phone, Mail, MapPin, Star, CreditCard } from "lucide-react";
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
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

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
        });
        setSelectedPaymentMethods(paymentMethods);
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
        });
        setSelectedPaymentMethods([]);
      }
    }
  }, [isOpen, mode, initialData, form]);

  const handlePaymentMethodChange = (methodId: string, checked: boolean) => {
    const newMethods = checked
      ? [...selectedPaymentMethods, methodId]
      : selectedPaymentMethods.filter(id => id !== methodId);
    
    setSelectedPaymentMethods(newMethods);
    form.setValue("paymentMethods", newMethods);
  };

  const handleSubmit = (data: TechnicianFormData) => {
    onSubmit({
      ...data,
      experience: parseInt(data.experience),
      hourlyRate: data.hourlyRate, // Keep as string - database expects decimal as string
      paymentMethods: selectedPaymentMethods.join(','), // Convert array to comma-separated string
    });
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
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

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