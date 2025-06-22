import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, 
  Star, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clipboard,
  CheckCircle,
  TrendingUp,
  Activity,
  Search
} from "lucide-react";
import type { Technician, WorkOrderWithUsers, WorkOrderTechnicianPayment } from "@shared/schema";

export default function TechnicianProfilePage() {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch technicians
  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["/api/technicians"],
  });

  // Fetch work orders
  const { data: workOrders = [] } = useQuery<WorkOrderWithUsers[]>({
    queryKey: ["/api/work-orders"],
  });

  // Fetch all payments
  const { data: allPayments = [] } = useQuery<WorkOrderTechnicianPayment[]>({
    queryKey: ["/api/payments"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount || "0") : amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "active": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "paid": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTechnicianStats = (technicianId: number) => {
    // Get work orders for this technician
    const technicianWorkOrders = workOrders.filter(wo => {
      try {
        const assignedUserIds = wo.assignedUserIds ? JSON.parse(wo.assignedUserIds) : [];
        return assignedUserIds.includes(technicianId);
      } catch {
        return false;
      }
    });

    // Get payments for this technician
    const technicianPayments = allPayments.filter(p => p.technicianId === technicianId);
    const approvedPayments = technicianPayments.filter(p => p.status === 'approved' || p.status === 'paid');
    
    const totalRequested = technicianPayments.reduce((sum, p) => sum + parseFloat(p.amountRequested), 0);
    const totalApproved = approvedPayments.reduce((sum, p) => sum + parseFloat(p.amountApproved || "0"), 0);
    const completedOrders = technicianWorkOrders.filter(wo => wo.status === 'completed').length;

    return {
      totalWorkOrders: technicianWorkOrders.length,
      completedOrders,
      totalRequested,
      totalApproved,
      paymentCount: technicianPayments.length,
      approvedPaymentCount: approvedPayments.length,
      workOrders: technicianWorkOrders,
      payments: technicianPayments
    };
  };

  const openTechnicianProfile = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsProfileModalOpen(true);
  };

  const filteredTechnicians = technicians.filter(technician => {
    const fullName = `${technician.firstName || ''} ${technician.lastName || ''}`.trim();
    const matchesSearch = fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      (technician.phoneNumber && technician.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Technician Profiles</h1>
          <p className="text-gray-600 mt-1">View technician work history and approved payments</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search technicians by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Technician Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians.map((technician) => {
          const stats = getTechnicianStats(technician.id);
          
          return (
            <Card key={technician.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTechnicianProfile(technician)}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                      technician.status === 'available' ? 'bg-green-500' : 
                      technician.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                    }`}>
                      {technician.firstName[0]}{technician.lastName[0]}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      technician.status === 'available' ? 'bg-green-500' : 
                      technician.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{technician.firstName || 'Unknown'} {technician.lastName || 'Technician'}</h3>
                    <p className="text-sm text-gray-600">{technician.specialization}</p>
                    {technician.averageRating && (
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">
                          {parseFloat(technician.averageRating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clipboard className="h-4 w-4 mr-2" />
                      Work Orders
                    </div>
                    <Badge variant="outline">
                      {stats.completedOrders}/{stats.totalWorkOrders}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approved Payments
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(stats.totalApproved)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Payment Requests
                    </div>
                    <Badge variant="outline">
                      {stats.approvedPaymentCount}/{stats.paymentCount}
                    </Badge>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {technician.phoneNumber}
                  </div>

                  {technician.currentLocation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {technician.currentLocation}
                    </div>
                  )}
                </div>

                <Button className="w-full mt-4" variant="outline">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Technician Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedTechnician && `${selectedTechnician.firstName || 'Unknown'} ${selectedTechnician.lastName || 'Technician'} Profile`}
            </DialogTitle>
            <DialogDescription>
              Complete work history and payment details
            </DialogDescription>
          </DialogHeader>

          {selectedTechnician && (
            <div className="space-y-6">
              {(() => {
                const stats = getTechnicianStats(selectedTechnician.id);
                
                return (
                  <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.totalWorkOrders}</div>
                          <div className="text-sm text-gray-600">Total Work Orders</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {formatCurrency(stats.totalRequested)}
                          </div>
                          <div className="text-sm text-gray-600">Total Requested</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.totalApproved)}
                          </div>
                          <div className="text-sm text-gray-600">Approved Payments</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Work Orders */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Work Order History</h3>
                      <div className="max-h-48 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Work Order</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.workOrders.map((wo) => (
                              <TableRow key={wo.id}>
                                <TableCell className="font-medium">{wo.workOrderNumber}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(wo.status)}>
                                    {wo.status.charAt(0).toUpperCase() + wo.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(wo.createdAt)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Payments */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Payment History (Approved Only)</h3>
                      <div className="max-h-48 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Payment Method</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.payments
                              .filter(p => p.status === 'approved' || p.status === 'paid')
                              .map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium text-green-600">
                                  {formatCurrency(payment.amountApproved || payment.amountRequested)}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getPaymentStatusColor(payment.status)}>
                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="capitalize">
                                  {payment.paymentMethod.replace('_', ' ')}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(payment.requestedAt)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}