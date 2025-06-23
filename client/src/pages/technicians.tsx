import { useState } from "react";
import { Plus, Edit, Phone, Star, CreditCard, Award, Mail, MapPin, Wrench, DollarSign, FileText, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { CreateTechnicianModal } from "@/components/modals/create-technician-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Technician } from "@shared/schema";

export default function Technicians() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/technicians/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Technician deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete technician",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (rating: number) => {
    if (rating >= 4.5) return "bg-green-100 text-green-800";
    if (rating >= 4.0) return "bg-blue-100 text-blue-800";
    if (rating >= 3.0) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: { [key: string]: string } = {
      paypal: "💳",
      credit_card: "💎",
      bank_transfer: "🏦",
      digital_wallet: "📱",
      cash: "💵",
      check: "📝",
      venmo: "📲",
      cashapp: "💸",
      zelle: "⚡",
      crypto: "₿"
    };
    return icons[method] || "💳";
  };

  const formatPaymentMethod = (method: string) => {
    const labels: { [key: string]: string } = {
      paypal: "PayPal",
      credit_card: "Credit/Debit Cards",
      bank_transfer: "Bank Transfer",
      digital_wallet: "Digital Wallets",
      cash: "Cash Payment",
      check: "Check Payment",
      venmo: "Venmo",
      cashapp: "Cash App",
      zelle: "Zelle",
      crypto: "Cryptocurrency"
    };
    return labels[method] || method;
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars 
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getAvailablePaymentMethods = (technician: any): string[] => {
    const methods = [];
    if (technician.bankAccount && technician.routingNumber) methods.push("Bank Transfer");
    if (technician.paypalEmail || technician.paypalLink) methods.push("PayPal");
    if (technician.venmoHandle) methods.push("Venmo");
    if (technician.cashappHandle) methods.push("CashApp");
    if (technician.zelleInfo) methods.push("Zelle");
    if (technician.mailingAddress) methods.push("Check");
    return methods;
  };

  const parsePaymentMethods = (methodsStr: string | null) => {
    if (!methodsStr) return [];
    try {
      return JSON.parse(methodsStr);
    } catch {
      return [];
    }
  };



  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Technician Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage technicians, their contact information, and payment methods.
            </p>
          </div>
          <PermissionGuard permission="manage_technicians">
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Technician
            </Button>
          </PermissionGuard>
        </div>

        {/* Technician Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((technician) => {
            return (
              <Card key={technician.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{technician.name}</CardTitle>
                      <div className="mt-2">
                        {renderStars(technician.averageRating || 0)}
                      </div>
                    </div>
                    <Badge className={getStatusColor(technician.averageRating || 0)}>
                      {technician.totalRatings} reviews
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {technician.phoneNumber}
                    </div>
                    
                    {technician.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="text-blue-600">{technician.email}</span>
                      </div>
                    )}

                    {technician.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{technician.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-2 pt-2 border-t">
                    {technician.specialties && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Wrench className="h-4 w-4 mr-2" />
                        <Badge variant="outline" className="text-xs">
                          {technician.specialties}
                        </Badge>
                      </div>
                    )}
                    
                    {technician.certifications && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{technician.certifications}</span>
                      </div>
                    )}

                    {technician.hourlyRate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span><strong>${technician.hourlyRate}/hour</strong></span>
                      </div>
                    )}

                    {technician.taxNumber && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Tax #: {technician.taxNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center text-sm text-gray-600 pt-2 border-t">
                    <div className={`h-2 w-2 rounded-full mr-2 ${
                      technician.status === 'available' ? 'bg-green-500' : 
                      technician.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="capitalize">{technician.status}</span>
                  </div>

                  {/* Payment Methods */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Payment Methods:
                    </div>
                    {(() => {
                      try {
                        const methods = JSON.parse(technician.paymentMethods || "[]");
                        if (methods.length === 0) {
                          return <span className="text-gray-500 text-xs">No payment methods configured</span>;
                        }
                        return (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {methods.map((method: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {getPaymentMethodIcon(method)} {formatPaymentMethod(method)}
                              </Badge>
                            ))}
                          </div>
                        );
                      } catch (error) {
                        console.error('Error parsing payment methods:', error);
                        // Fallback for old format
                        const methods = getAvailablePaymentMethods(technician);
                        if (methods.length === 0) {
                          return <span className="text-gray-500 text-xs">No payment methods configured</span>;
                        }
                        return (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {methods.map((method, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        );
                      }
                    })()}
                    
                    {/* Payment Details Preview */}
                    {(() => {
                      try {
                        const details = JSON.parse(technician.paymentDetails || "{}");
                        if (Object.keys(details).length === 0) return null;
                        
                        return (
                          <div className="text-xs text-gray-500 space-y-1 mt-1">
                            {details.credit_card && (
                              <div>💳 Card: ****{details.credit_card.cardNumber?.slice(-4)}</div>
                            )}
                            {details.bank_transfer && (
                              <div>🏦 Bank: {details.bank_transfer.bankName}</div>
                            )}
                            {details.paypal && (
                              <div>💳 PayPal: {details.paypal.paypalEmail}</div>
                            )}
                            {details.venmo && (
                              <div>📱 Venmo: @{details.venmo.venmoHandle}</div>
                            )}
                            {details.cashapp && (
                              <div>💰 CashApp: ${details.cashapp.cashappHandle}</div>
                            )}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>

                  {/* Location Coordinates (if available) */}
                  {technician.latitude && technician.longitude && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS: {parseFloat(technician.latitude).toFixed(4)}, {parseFloat(technician.longitude).toFixed(4)}
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="px-6 py-3 bg-gray-50 border-t">
                  <div className="flex space-x-2">
                    <PermissionGuard permission="manage_technicians">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTechnician(technician)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </PermissionGuard>
                    
                    <PermissionGuard permission="manage_technicians">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Technician</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {technician.name}? This action cannot be undone and will remove all associated data including ratings and work assignments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTechnicianMutation.mutate(technician.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteTechnicianMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </PermissionGuard>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {technicians.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No technicians found</h3>
              <p className="text-sm">Get started by adding your first technician.</p>
            </div>
          </div>
        )}
      </div>

      <CreateTechnicianModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        technician={null}
      />

      {editingTechnician && (
        <CreateTechnicianModal
          isOpen={!!editingTechnician}
          onClose={() => setEditingTechnician(null)}
          technician={editingTechnician}
        />
      )}
    </div>
  );
}