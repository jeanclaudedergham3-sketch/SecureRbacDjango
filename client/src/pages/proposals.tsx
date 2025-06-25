import { useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Clock, Filter, FileText, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkOrderProposalModal } from "@/components/modals/work-order-proposal-modal";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WorkOrderWithUsers, WorkOrderProposal } from "@shared/schema";

export default function Proposals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithUsers | null>(null);

  const { data: workOrders = [] } = useQuery<WorkOrderWithUsers[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: allProposals = [] } = useQuery<(WorkOrderProposal & { workOrder: WorkOrderWithUsers })[]>({
    queryKey: ["/api/proposals"],
  });

  const approveProposalMutation = useMutation({
    mutationFn: (proposalId: number) => 
      apiRequest("PUT", `/api/proposals/${proposalId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: "Proposal approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve proposal",
        variant: "destructive",
      });
    },
  });

  const rejectProposalMutation = useMutation({
    mutationFn: (proposalId: number) => 
      apiRequest("PUT", `/api/proposals/${proposalId}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: "Proposal rejected successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject proposal",
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
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  // Calculate proposal total from JSON data
  const calculateProposalTotal = (proposal: WorkOrderProposal) => {
    let total = 0;
    
    try {
      // Labor total
      if (proposal.laborData) {
        const labor = JSON.parse(proposal.laborData);
        total += labor.reduce((sum: number, entry: any) => {
          const payRate = parseFloat(entry.payRate) || 0;
          const regularHours = parseFloat(entry.regularHours) || 0;
          const otHours = parseFloat(entry.otHours) || 0;
          const otScale = parseFloat(entry.otScale) || 1.5;
          return sum + (payRate * regularHours) + (payRate * otHours * otScale);
        }, 0);
      }

      // Parts total
      if (proposal.partsData) {
        const parts = JSON.parse(proposal.partsData);
        total += parts.reduce((sum: number, entry: any) => {
          const unitCost = parseFloat(entry.unitCost) || 0;
          const quantity = parseFloat(entry.quantity) || 0;
          return sum + (unitCost * quantity);
        }, 0);
      }

      // Services total
      if (proposal.servicesData) {
        const services = JSON.parse(proposal.servicesData);
        total += services.reduce((sum: number, entry: any) => {
          const unitCost = parseFloat(entry.unitCost) || 0;
          const quantity = parseFloat(entry.quantity) || 0;
          return sum + (unitCost * quantity);
        }, 0);
      }
    } catch (error) {
      console.error("Error calculating proposal total:", error);
    }

    return total;
  };

  // Filter proposals based on search and status
  const filteredProposals = allProposals.filter(item => {
    const matchesSearch = 
      item.workOrder.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.workOrder.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get statistics
  const stats = {
    total: allProposals.length,
    pending: allProposals.filter(p => p.status === "pending").length,
    approved: allProposals.filter(p => p.status === "approved").length,
    cancelled: allProposals.filter(p => p.status === "cancelled").length,
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Proposal Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review and manage all work order proposals with approval workflow.
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => window.location.href = '/work-orders'}>
              View Work Orders
            </Button>
            <PermissionGuard permission="workorders.create">
              <Button onClick={() => window.location.href = '/work-orders'}>
                Create New Work Order
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Proposals</p>
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
              placeholder="Search by work order number or client name..."
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
        </div>

        {/* Proposals List */}
        <div className="mt-6 space-y-4">
          {filteredProposals.length > 0 ? (
            filteredProposals.map((item) => {
              const proposalTotal = calculateProposalTotal(item);
              
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-blue-600">
                              {item.workOrder.workOrderNumber}
                            </h3>
                            <p className="text-gray-900 font-medium">
                              {item.workOrder.clientName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.workOrder.street}, {item.workOrder.city}
                            </p>
                          </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Work Order Value</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(item.workOrder.tnte)}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Proposal Total</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatCurrency(proposalTotal.toString())}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {item.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">{item.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(item.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(item.status)}
                          <span>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                        </div>
                      </Badge>
                      
                      <div className="flex items-center space-x-2">
                        {item.status === "pending" && (
                          <PermissionGuard permission="proposals.approve">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => approveProposalMutation.mutate(item.id)}
                              disabled={approveProposalMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => rejectProposalMutation.mutate(item.id)}
                              disabled={rejectProposalMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </PermissionGuard>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkOrder(item.workOrder)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No proposals found</h3>
                <p className="text-sm">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search criteria or filters."
                    : "Proposals will appear here when work orders have proposal data."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedWorkOrder && (
        <WorkOrderProposalModal
          isOpen={!!selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          workOrder={selectedWorkOrder}
        />
      )}
    </div>
  );
}