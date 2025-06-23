import { useState } from "react";
import { Plus, Edit, Phone, Mail, MapPin, Star, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { CreateTechnicianModal } from "@/components/modals/create-technician-modal";
import type { Technician } from "@shared/schema";

export default function Technicians() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  const getStatusColor = (rating: string) => {
    const num = parseFloat(rating);
    if (num >= 4.5) return "bg-green-100 text-green-800";
    if (num >= 4.0) return "bg-blue-100 text-blue-800";
    if (num >= 3.0) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const renderStars = (rating: string) => {
    const num = parseFloat(rating);
    const fullStars = Math.floor(num);
    const hasHalfStar = num % 1 >= 0.5;
    
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
        <span className="ml-1 text-sm text-gray-600">({num})</span>
      </div>
    );
  };

  const parsePaymentMethods = (methodsStr: string | null) => {
    if (!methodsStr) return [];
    try {
      return JSON.parse(methodsStr);
    } catch {
      return [];
    }
  };

  const formatPaymentMethod = (method: string) => {
    const methodNames = {
      paypal: "PayPal",
      credit_card: "Credit Card",
      cash: "Cash",
      bank_transfer: "Bank Transfer"
    };
    return methodNames[method] || method;
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
            const paymentMethods = getAvailablePaymentMethods(technician);
            
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
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {technician.phoneNumber}
                  </div>
                  
                  {technician.specialties && (
                    <div className="flex items-center text-sm text-gray-600">
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

                  <div className="flex items-center text-sm text-gray-600">
                    <div className={`h-2 w-2 rounded-full mr-2 ${
                      technician.status === 'available' ? 'bg-green-500' : 
                      technician.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="capitalize">{technician.status}</span>
                  </div>

                  {paymentMethods.length > 0 && (
                    <div>
                      <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Payment Methods:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {paymentMethods.map((method, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="px-6 py-3 bg-gray-50 border-t">
                  <PermissionGuard permission="manage_technicians">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTechnician(technician)}
                      className="w-full"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Details
                    </Button>
                  </PermissionGuard>
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