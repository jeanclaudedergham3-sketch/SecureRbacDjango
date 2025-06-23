import { Users, UserCheck, Cog, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const activities = [
    {
      id: 1,
      type: "user_created",
      description: "New user Sarah Wilson was created by Admin",
      time: "2 hours ago",
      icon: Users,
      color: "bg-green-500",
    },
    {
      id: 2,
      type: "role_assigned",
      description: "Role Manager assigned to Mike Johnson",
      time: "4 hours ago",
      icon: UserCheck,
      color: "bg-blue-500",
    },
    {
      id: 3,
      type: "work_order_created",
      description: "New work order WO-2025-002 created",
      time: "6 hours ago",
      icon: Cog,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Here's what's happening with your system.
        </p>
      </div>

      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <PermissionGuard permission="view_users">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.totalUsers || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="text-green-600 font-medium flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            </Card>
          </PermissionGuard>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Roles
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.activeRoles || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-gray-500">Admin, Manager, Viewer</span>
              </div>
            </div>
          </Card>



          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Security Events
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.securityEvents || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">All Clear</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions and events in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.map((activity, activityIdx) => {
                    const Icon = activity.icon;
                    return (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== activities.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full ${activity.color} flex items-center justify-center ring-8 ring-white`}>
                                <Icon className="h-3 w-3 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {activity.description}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>{activity.time}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
