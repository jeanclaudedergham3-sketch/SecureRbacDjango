import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, MapPin, User, FileText, MessageSquare, CreditCard, Receipt, Upload, Hammer } from "lucide-react";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { WorkOrderProposalModal } from "@/components/modals/work-order-proposal-modal";
import { useAuth } from "@/hooks/use-auth";
import type { WorkOrderWithUsers } from "@shared/schema";

interface WorkOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers;
}

export function WorkOrderDetailsModal({ isOpen, onClose, workOrder }: WorkOrderDetailsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  // Check if user can access this work order (assigned user or has manage permission)
  const canAccess = (() => {
    if (user?.permissions?.includes("manage_work_orders")) return true;
    
    try {
      const assignedUserIds = workOrder.assignedUserIds ? JSON.parse(workOrder.assignedUserIds) : [];
      return assignedUserIds.includes(user?.id);
    } catch {
      return false;
    }
  })();

  if (!canAccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to view this work order.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-blue-600">
                {workOrder.workOrderNumber}
              </DialogTitle>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {workOrder.clientName}
              </p>
            </div>
            <Badge className={getStatusColor(workOrder.status)}>
              {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex items-center gap-1">
              <Hammer className="h-3 w-3" />
              Proposal
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Parts
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Files
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-gray-600">
                      {workOrder.street}<br />
                      {workOrder.city}, {workOrder.country}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Assigned to:</span>
                    {workOrder.assignedUsers && workOrder.assignedUsers.length > 0 ? (
                      <div className="space-y-1">
                        {workOrder.assignedUsers.map((user) => (
                          <div key={user.id}>
                            <p className="text-gray-600">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              ({user.email})
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No users assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Project Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Start Date:</span>
                    <p className="text-gray-600">{formatDate(workOrder.startDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium">End Date:</span>
                    <p className="text-gray-600">{formatDate(workOrder.endDate)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">NTE (without tax):</span>
                    <p className="text-gray-600">{formatCurrency(workOrder.nte)}</p>
                  </div>
                  <div>
                    <span className="font-medium">TNTE (including tax):</span>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(workOrder.tnte)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="proposal" className="space-y-4">
            <div className="text-center py-8">
              <Hammer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Proposal Management</h3>
              <p className="text-gray-600 mb-4">
                Create and manage labor, parts, and services proposals for this work order.
              </p>
              <PermissionGuard permission="manage_work_orders">
                <Button onClick={() => setIsProposalModalOpen(true)}>
                  Manage Proposal
                </Button>
              </PermissionGuard>
            </div>
          </TabsContent>

          <TabsContent value="parts" className="space-y-4">
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Parts Requests</h3>
              <p className="text-gray-600 mb-4">
                Request parts and materials for this work order.
              </p>
              <Button>
                Request Parts
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">File Management</h3>
              <p className="text-gray-600 mb-4">
                Upload before/after photos and documents for this work order.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">Before</p>
                    <p className="text-sm text-gray-500">0 files</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">After</p>
                    <p className="text-sm text-gray-500">0 files</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="font-medium">Signature</p>
                    <p className="text-sm text-gray-500">0 files</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Work Order Chat</h3>
              <p className="text-gray-600 mb-4">
                Communicate with team members about this work order.
              </p>
              <p className="text-sm text-gray-500">
                Only assigned users can access this chat.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Technician Payments</h3>
              <p className="text-gray-600 mb-4">
                Manage technician payments and invoicing for this work order.
              </p>
              <PermissionGuard permission="manage_payments">
                <Button>
                  Add Payment Request
                </Button>
              </PermissionGuard>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      {isProposalModalOpen && (
        <WorkOrderProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          workOrder={workOrder}
        />
      )}
    </Dialog>
  );
}