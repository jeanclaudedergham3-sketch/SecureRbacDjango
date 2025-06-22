import { Plus, Settings, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import type { Equipment } from "@shared/schema";

export default function Equipment() {
  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "server":
        return "🖥️";
      case "network":
        return "🌐";
      case "storage":
        return "💾";
      default:
        return "⚙️";
    }
  };

  const getProgressColor = (usage: number) => {
    if (usage >= 80) return "bg-red-500";
    if (usage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Equipment Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Monitor and manage system equipment.
            </p>
          </div>
          <PermissionGuard permission="edit_equipment">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </PermissionGuard>
        </div>

        {/* Equipment Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">Loading equipment...</div>
          ) : equipment.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No equipment found
            </div>
          ) : (
            equipment.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {getIconForType(item.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.status === "online" && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">CPU Usage</span>
                          <span className="font-medium">{item.cpuUsage}%</span>
                        </div>
                        <Progress 
                          value={item.cpuUsage || 0} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Memory</span>
                          <span className="font-medium">{item.memoryUsage}%</span>
                        </div>
                        <Progress 
                          value={item.memoryUsage || 0} 
                          className="h-2"
                        />
                      </div>
                    </>
                  )}
                  
                  {item.status === "offline" && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Equipment is offline</p>
                      <p className="text-xs text-red-600 mt-1">Status: Maintenance</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <PermissionGuard permission="edit_equipment">
                      <Button 
                        size="sm" 
                        className={`flex-1 ${item.status === "offline" ? "bg-red-600 hover:bg-red-700" : ""}`}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {item.status === "offline" ? "Restart" : "Configure"}
                      </Button>
                    </PermissionGuard>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
