import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Star, Clock, Search, Filter, CheckCircle2, User } from "lucide-react";
import type { Technician } from "@shared/schema";

interface TechnicianMapSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTechnicianSelect: (technician: Technician) => void;
  selectedTechnicianId?: string;
}

export function TechnicianMapSelectionModal({ 
  isOpen, 
  onClose, 
  onTechnicianSelect, 
  selectedTechnicianId 
}: TechnicianMapSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  // Fetch technicians
  const { data: technicians = [], isLoading } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
    enabled: isOpen,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "busy": return "bg-red-100 text-red-800";
      case "offline": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter technicians
  const filteredTechnicians = technicians.filter((technician) => {
    const matchesSearch = `${technician.firstName} ${technician.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      (technician.phoneNumber && technician.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (technician.currentLocation && technician.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || technician.status === statusFilter;
    const matchesLocation = locationFilter === "all" || 
      (technician.currentLocation && technician.currentLocation.toLowerCase().includes(locationFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const handleTechnicianClick = (technician: Technician) => {
    onTechnicianSelect(technician);
    onClose();
  };

  // Get unique locations for filter
  const uniqueLocations = [...new Set(technicians.map(t => t.currentLocation).filter(Boolean))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Technician from Map</DialogTitle>
          <DialogDescription>
            Choose a technician from the list below. Click on a technician card to select them for the payment request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location || ""}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Map Placeholder */}
          <Card className="h-48">
            <CardContent className="h-full p-4">
              <div className="h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                <MapPin className="h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">Interactive Map View</h3>
                <p className="text-sm text-gray-500 text-center">
                  Map showing {filteredTechnicians.length} technician locations
                  <br />
                  (Production ready for map integration)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technician List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-2">
              Available Technicians ({filteredTechnicians.length})
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No technicians found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTechnicians.map((technician) => (
                  <Card 
                    key={technician.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTechnicianId === technician.id.toString()
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    onClick={() => handleTechnicianClick(technician)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                              technician.status === 'available' ? 'bg-green-500' : 
                              technician.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                              {technician.firstName[0]}{technician.lastName[0]}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              technician.status === 'available' ? 'bg-green-500' : 
                              technician.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                            {selectedTechnicianId === technician.id.toString() && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{technician.firstName} {technician.lastName}</h3>
                            <p className="text-sm text-gray-600">{technician.specialization}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(technician.status)}>
                          {technician.status.charAt(0).toUpperCase() + technician.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-500" />
                            <span>⭐ {technician.averageRating ? parseFloat(technician.averageRating).toFixed(1) : 'No rating'}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            <span>{technician.phoneNumber}</span>
                          </div>
                        </div>
                        
                        {technician.currentLocation && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{technician.currentLocation}</span>
                          </div>
                        )}

                        {technician.lastActiveAt && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Last active: {formatDate(technician.lastActiveAt)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={onClose}
              disabled={!selectedTechnicianId}
            >
              Use Selected Technician
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}