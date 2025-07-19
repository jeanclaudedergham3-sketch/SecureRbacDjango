import { useState } from "react";
import { Search, Package, CheckCircle, XCircle, Clock, Filter, User, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WorkOrderPartsRequest } from "@shared/schema";

interface PartsRequestWithWorkOrder extends WorkOrderPartsRequest {
  workOrder: {
    workOrderNumber: string;
    clientName: string;
    street: string;
    city: string;
  };
  requestedByUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function PartsRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const { data: allPartsRequests = [] } = useQuery<PartsRequestWithWorkOrder[]>({
    queryKey: ["/api/parts-requests"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest("PUT", `/api/parts-requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-requests"] });
      toast({
        title: "Success",
        description: "Parts request status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update parts request status",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRequestTotal = (partsRequest: PartsRequestWithWorkOrder) => {
    const cost = parseFloat(partsRequest.estimatedCost || "0");
    const quantity = partsRequest.quantity || 0;
    return cost * quantity;
  };

  // Filter parts requests
  const filteredRequests = allPartsRequests.filter(request => {
    const matchesSearch = 
      request.workOrder.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.workOrder.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedByUser.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedByUser.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    // Check urgency from individual request
    const hasMatchingUrgency = urgencyFilter === "all" || request.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && hasMatchingUrgency;
  });

  // Get statistics
  const stats = {
    total: allPartsRequests.length,
    pending: allPartsRequests.filter(r => r.status === "pending").length,
    approved: allPartsRequests.filter(r => r.status === "approved").length,
    cancelled: allPartsRequests.filter(r => r.status === "cancelled").length,
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Parts Request Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review and manage all parts requests for work orders.
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => window.location.href = '/work-orders'}>
              View Work Orders
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search by work order, client, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parts Requests List */}
        <div className="mt-6 space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const requestTotal = calculateRequestTotal(request);

              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-blue-600">
                                {request.workOrder.workOrderNumber}
                              </h3>
                              <Badge className={getStatusColor(request.status)}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(request.status)}
                                  <span>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                                </div>
                              </Badge>
                            </div>
                            <p className="text-gray-900 font-medium">
                              {request.workOrder.clientName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.workOrder.street}, {request.workOrder.city}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Requested By</p>
                            <p className="font-medium">
                              {request.requestedByUser.firstName} {request.requestedByUser.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.requestedByUser.email}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Estimated Total</p>
                            <p className="text-lg font-semibold text-green-600">
                              ${requestTotal.toFixed(2)}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-sm text-gray-500">Requested</p>
                            <p className="text-sm text-gray-900">
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Parts Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Part Details:</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{request.partName}</span>
                                  {request.urgency && (
                                    <Badge className={getUrgencyColor(request.urgency)} variant="outline">
                                      {request.urgency}
                                    </Badge>
                                  )}
                                </div>
                                {request.partNumber && (
                                  <p className="text-sm text-gray-500">PN: {request.partNumber}</p>
                                )}
                                {request.supplier && (
                                  <p className="text-sm text-gray-500">Supplier: {request.supplier}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">Qty: {request.quantity}</p>
                                <p className="text-sm text-gray-500">${request.estimatedCost} each</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {request.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800"><strong>Notes:</strong> {request.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        {request.status === "pending" && (
                          <PermissionGuard permission="system.admin">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: "approved" })}
                                disabled={updateStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: "cancelled" })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Cancel
                              </Button>
                            </div>
                          </PermissionGuard>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No parts requests found</h3>
                <p className="text-sm">
                  {searchTerm || statusFilter !== "all" || urgencyFilter !== "all"
                    ? "Try adjusting your search criteria or filters."
                    : "Parts requests will appear here when submitted from work orders."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}