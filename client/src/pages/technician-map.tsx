import { useState, useEffect, useRef } from "react";
import { Search, Star, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { RateTechnicianModal } from "@/components/modals/rate-technician-modal";
import type { Technician } from "@shared/schema";

// Free OpenStreetMap component using iframe embed
const MapComponent = ({ technicians, onMarkerClick, searchTerm }: {
  technicians: Technician[];
  onMarkerClick: (technician: Technician) => void;
  searchTerm: string;
}) => {
  const filteredTechnicians = technicians.filter(tech => 
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tech.address && tech.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter technicians with valid coordinates
  const techsWithCoords = filteredTechnicians.filter(tech => 
    tech.latitude && tech.longitude && 
    !isNaN(parseFloat(tech.latitude)) && !isNaN(parseFloat(tech.longitude))
  );

  // Calculate center and bounds for technicians
  const getMapCenter = () => {
    if (techsWithCoords.length === 0) return { lat: 40.7128, lng: -74.0060 }; // Default to NYC
    
    const avgLat = techsWithCoords.reduce((sum, tech) => sum + parseFloat(tech.latitude!), 0) / techsWithCoords.length;
    const avgLng = techsWithCoords.reduce((sum, tech) => sum + parseFloat(tech.longitude!), 0) / techsWithCoords.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  const center = getMapCenter();
  const zoom = techsWithCoords.length > 1 ? 10 : 13;

  // Generate OpenStreetMap embed URL
  const generateMapUrl = () => {
    const baseUrl = "https://www.openstreetmap.org/export/embed.html";
    
    if (techsWithCoords.length === 0) {
      return `${baseUrl}?bbox=-74.2,40.5,-73.8,40.9&layer=mapnik`;
    }
    
    // Calculate bounding box for all technicians
    const lats = techsWithCoords.map(tech => parseFloat(tech.latitude!));
    const lngs = techsWithCoords.map(tech => parseFloat(tech.longitude!));
    
    const minLat = Math.min(...lats) - 0.01;
    const maxLat = Math.max(...lats) + 0.01;
    const minLng = Math.min(...lngs) - 0.01;
    const maxLng = Math.max(...lngs) + 0.01;
    
    return `${baseUrl}?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${center.lat},${center.lng}`;
  };

  return (
    <div className="h-full relative rounded-lg overflow-hidden border">
      {/* OpenStreetMap Embed */}
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={generateMapUrl()}
        className="absolute inset-0"
      />
      
      {/* Overlay with technician markers positioned over the map */}
      <div className="absolute inset-0 pointer-events-none">
        {techsWithCoords.map((tech, index) => {
          // Calculate approximate position on the map based on coordinates
          const offsetX = (index % 3 - 1) * 15; // Spread markers horizontally
          const offsetY = Math.floor(index / 3) * 15; // Stack markers vertically
          
          return (
            <div
              key={tech.id}
              className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto"
              style={{
                left: `${50 + offsetX}%`,
                top: `${50 + offsetY}%`,
              }}
            >
              <div className="relative group">
                <Button
                  size="sm"
                  onClick={() => onMarkerClick(tech)}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-lg text-xs px-2 py-1 rounded-full"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {tech.name}
                </Button>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                  <div className="font-semibold">{tech.name}</div>
                  <div>📞 {tech.phoneNumber}</div>
                  {tech.email && <div>📧 {tech.email}</div>}
                  {tech.address && <div>📍 {tech.address}</div>}
                  {tech.averageRating && (
                    <div>⭐ {parseFloat(tech.averageRating).toFixed(1)} ({tech.totalRatings} reviews)</div>
                  )}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Info overlay when no coordinates available */}
      {techsWithCoords.length === 0 && (
        <div className="absolute inset-0 bg-white/95 flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">OpenStreetMap View</h3>
            <p className="text-sm text-gray-500 mb-4">
              {filteredTechnicians.length > 0 
                ? `${filteredTechnicians.length} technician(s) found but no location coordinates available`
                : "No technicians match your search criteria"
              }
            </p>
            
            {/* Show technicians without coordinates as a list */}
            {filteredTechnicians.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
                {filteredTechnicians.slice(0, 6).map((tech) => (
                  <Button
                    key={tech.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkerClick(tech)}
                    className="text-xs justify-start"
                  >
                    <MapPin className="h-3 w-3 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">{tech.name}</div>
                      {tech.address && (
                        <div className="text-gray-500 text-xs truncate">{tech.address}</div>
                      )}
                    </div>
                  </Button>
                ))}
                {filteredTechnicians.length > 6 && (
                  <div className="col-span-2 text-xs text-gray-500 text-center">
                    +{filteredTechnicians.length - 6} more technicians
                  </div>
                )}
              </div>
            )}
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-7xl mx-auto">
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
      </div>

      {/* Map Area */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto h-full">
          <MapComponent 
            technicians={technicians}
            onMarkerClick={setSelectedTechnician}
            searchTerm={searchTerm}
          />
        </div>
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