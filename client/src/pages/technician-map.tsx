import { useState } from "react";
import { Search, Star, Phone, Mail, MapPin, CreditCard, Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { RateTechnicianModal } from "@/components/modals/rate-technician-modal";
import type { Technician } from "@shared/schema";

const MapComponent = ({ technicians, onMarkerClick, searchTerm }: {
  technicians: Technician[];
  onMarkerClick: (technician: Technician) => void;
  searchTerm: string;
}) => {
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  
  const filteredTechnicians = technicians.filter(tech => 
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tech.address && tech.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate bounds for technicians
  const bounds = filteredTechnicians.reduce((acc, tech) => {
    if (tech.latitude && tech.longitude) {
      const lat = parseFloat(tech.latitude);
      const lng = parseFloat(tech.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        acc.minLat = Math.min(acc.minLat, lat);
        acc.maxLat = Math.max(acc.maxLat, lat);
        acc.minLng = Math.min(acc.minLng, lng);
        acc.maxLng = Math.max(acc.maxLng, lng);
      }
    }
    return acc;
  }, { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 });

  // Default to San Francisco if no technicians with coordinates
  const centerLat = bounds.minLat < 90 ? (bounds.minLat + bounds.maxLat) / 2 : 37.7749;
  const centerLng = bounds.minLng < 180 ? (bounds.minLng + bounds.maxLng) / 2 : -122.4194;

  const getMarkerColor = (rating: string) => {
    const num = parseFloat(rating);
    if (num >= 4.5) return 'bg-green-500';
    if (num >= 4.0) return 'bg-blue-500';
    if (num >= 3.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleMarkerClick = (tech: Technician) => {
    setSelectedTech(tech);
    onMarkerClick(tech);
  };

  // Create a visual map representation
  return (
    <div className="h-full w-full relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      {/* Map Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="bg-white rounded-lg shadow-lg px-4 py-2">
          <h3 className="font-semibold text-gray-800">Technician Locations</h3>
          <p className="text-xs text-gray-600">
            Center: {centerLat.toFixed(4)}°, {centerLng.toFixed(4)}°
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-sm">
          <span className="font-medium">{filteredTechnicians.length}</span> technicians
        </div>
      </div>

      {/* Map Grid Background */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-10">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Street Lines (simulated) */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-20">
          <path d="M0,150 Q300,120 600,140 T1200,130" stroke="#6b7280" strokeWidth="3" fill="none"/>
          <path d="M0,250 L1200,280" stroke="#6b7280" strokeWidth="2" fill="none"/>
          <path d="M0,350 Q400,330 800,345 T1200,340" stroke="#6b7280" strokeWidth="3" fill="none"/>
          <path d="M200,0 L180,600" stroke="#6b7280" strokeWidth="2" fill="none"/>
          <path d="M400,0 L420,600" stroke="#6b7280" strokeWidth="2" fill="none"/>
          <path d="M700,0 Q690,300 720,600" stroke="#6b7280" strokeWidth="3" fill="none"/>
        </svg>
      </div>

      {/* Technician Markers */}
      <div className="absolute inset-0 p-8">
        {filteredTechnicians.map((tech, index) => {
          if (!tech.latitude || !tech.longitude) return null;
          
          const lat = parseFloat(tech.latitude);
          const lng = parseFloat(tech.longitude);
          
          if (isNaN(lat) || isNaN(lng)) return null;

          // Calculate position relative to map bounds (simplified projection)
          const x = bounds.minLng < 180 
            ? ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 80 + 10
            : 20 + (index % 4) * 20;
          
          const y = bounds.minLat < 90 
            ? ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 80 + 10
            : 20 + Math.floor(index / 4) * 20;

          return (
            <div
              key={tech.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => handleMarkerClick(tech)}
            >
              {/* Marker */}
              <div className={`relative ${getMarkerColor(tech.averageRating || "0")} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold`}>
                {parseFloat(tech.averageRating || "0").toFixed(1)}
                
                {/* Marker Pin */}
                <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${getMarkerColor(tech.averageRating || "0").replace('bg-', 'border-t-')}`}></div>
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {tech.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-semibold mb-2">Rating Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>4.5+ Excellent</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>4.0+ Very Good</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>3.0+ Good</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>&lt;3.0 Needs Improvement</span>
          </div>
        </div>
      </div>

      {/* Compass */}
      <div className="absolute top-4 right-20 bg-white rounded-full shadow-lg p-2">
        <Navigation className="h-6 w-6 text-gray-600" />
      </div>

      {/* No technicians message */}
      {filteredTechnicians.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No technicians found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TechnicianMap() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

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
        <span className="ml-2 text-sm font-medium">{num}</span>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Technician Map</h1>
            <p className="text-sm text-gray-600">
              Find technicians by location and view their details
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="bg-white rounded-lg shadow border" style={{ height: 'calc(100vh - 200px)' }}>
        <MapComponent 
          technicians={technicians}
          onMarkerClick={setSelectedTechnician}
          searchTerm={searchTerm}
        />
      </div>

      {/* Technician Details Modal */}
      <Dialog open={!!selectedTechnician} onOpenChange={() => setSelectedTechnician(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedTechnician && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  {selectedTechnician.name}
                  <Badge className="ml-2">
                    {selectedTechnician.totalRatings} reviews
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Rating */}
                <div className="flex items-center justify-between">
                  {renderStars(selectedTechnician.averageRating || "0")}
                  <PermissionGuard permission="rate_technicians">
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsRatingModalOpen(true);
                      }}
                    >
                      Rate Technician
                    </Button>
                  </PermissionGuard>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="font-medium mr-2">Phone:</span>
                    <a href={`tel:${selectedTechnician.phoneNumber}`} className="text-blue-600 hover:underline">
                      {selectedTechnician.phoneNumber}
                    </a>
                  </div>

                  {selectedTechnician.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="font-medium mr-2">Email:</span>
                      <a href={`mailto:${selectedTechnician.email}`} className="text-blue-600 hover:underline">
                        {selectedTechnician.email}
                      </a>
                    </div>
                  )}

                  {selectedTechnician.address && (
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                      <div>
                        <span className="font-medium">Address:</span>
                        <p className="text-gray-700 mt-1">{selectedTechnician.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tax Number */}
                {selectedTechnician.taxNumber && (
                  <div className="text-sm">
                    <span className="font-medium">Tax Number:</span>
                    <span className="ml-2 text-gray-700">{selectedTechnician.taxNumber}</span>
                  </div>
                )}

                {/* Payment Methods */}
                {selectedTechnician.paymentMethods && (
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment Methods
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parsePaymentMethods(selectedTechnician.paymentMethods).map((method, index) => (
                        <Badge key={index} variant="outline">
                          {formatPaymentMethod(method)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Coordinates */}
                {selectedTechnician.latitude && selectedTechnician.longitude && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Coordinates: {selectedTechnician.latitude}, {selectedTechnician.longitude}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      {selectedTechnician && (
        <RateTechnicianModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          technician={selectedTechnician}
        />
      )}
    </div>
  );
}