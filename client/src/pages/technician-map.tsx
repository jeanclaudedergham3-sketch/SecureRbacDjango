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

// Real Google Maps component
const MapComponent = ({ technicians, onMarkerClick, searchTerm }: {
  technicians: Technician[];
  onMarkerClick: (technician: Technician) => void;
  searchTerm: string;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  const filteredTechnicians = technicians.filter(tech => 
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tech.address && tech.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter technicians with valid coordinates
  const techsWithCoords = filteredTechnicians.filter(tech => 
    tech.latitude && tech.longitude && 
    !isNaN(parseFloat(tech.latitude)) && !isNaN(parseFloat(tech.longitude))
  );

  // Initialize Google Map
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const mapOptions = {
        zoom: 10,
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
    };

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dQWTcyT4eDlx_I&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  // Add markers when technicians or map changes
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    if (techsWithCoords.length === 0) return;

    const newMarkers: any[] = [];
    const bounds = new window.google.maps.LatLngBounds();

    techsWithCoords.forEach((tech) => {
      const position = {
        lat: parseFloat(tech.latitude!),
        lng: parseFloat(tech.longitude!)
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: tech.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0ZM16 21.6C13.02 21.6 10.4 19.08 10.4 16C10.4 12.92 13.02 10.4 16 10.4C18.98 10.4 21.6 12.92 21.6 16C21.6 19.08 18.98 21.6 16 21.6Z" fill="#DC2626"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 40),
          anchor: new window.google.maps.Point(16, 40)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${tech.name}</h3>
            <div style="margin: 4px 0; font-size: 14px;">📞 ${tech.phoneNumber}</div>
            ${tech.email ? `<div style="margin: 4px 0; font-size: 14px;">📧 ${tech.email}</div>` : ''}
            ${tech.address ? `<div style="margin: 4px 0; font-size: 14px;">📍 ${tech.address}</div>` : ''}
            ${tech.averageRating ? `<div style="margin: 4px 0; font-size: 14px;">⭐ ${parseFloat(tech.averageRating).toFixed(1)} (${tech.totalRatings} reviews)</div>` : ''}
            <button onclick="window.showTechnicianDetails(${tech.id})" style="
              margin-top: 8px; 
              padding: 4px 12px; 
              background: #2563eb; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer;
              font-size: 12px;
            ">View Details</button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (techsWithCoords.length === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    } else if (techsWithCoords.length > 1) {
      map.fitBounds(bounds);
    }
  }, [map, techsWithCoords]);

  // Global function to handle technician details
  useEffect(() => {
    window.showTechnicianDetails = (techId: number) => {
      const tech = technicians.find(t => t.id === techId);
      if (tech) onMarkerClick(tech);
    };

    return () => {
      delete window.showTechnicianDetails;
    };
  }, [technicians, onMarkerClick]);

  return (
    <div className="h-full relative rounded-lg overflow-hidden border">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading overlay */}
      {!map && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading interactive map...</p>
          </div>
        </div>
      )}
      
      {/* No coordinates overlay */}
      {map && techsWithCoords.length === 0 && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Location Data</h3>
            <p className="text-sm text-gray-500 mb-4">
              {filteredTechnicians.length > 0 
                ? `${filteredTechnicians.length} technician(s) found but no location coordinates available`
                : "No technicians match your search criteria"
              }
            </p>
            
            {filteredTechnicians.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
                {filteredTechnicians.slice(0, 4).map((tech) => (
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