import { Users, UserCheck, Cog, Shield, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user, role } = useAuth();
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

  // Calculate user-specific progress based on role
  const getUserProgress = () => {
    if (!role || !stats) return { percentage: 0, label: "Loading..." };
    
    switch (role.name) {
      case "admin":
        // Admin sees overall system completion
        const totalTasks = (stats.totalUsers + stats.activeRoles + stats.techniciansCount + stats.workOrdersCount) || 1;
        const completedTasks = stats.workOrdersCompleted || 0;
        return {
          percentage: Math.round((completedTasks / totalTasks) * 100),
          label: "System Management Progress",
          current: completedTasks,
          total: totalTasks
        };
      case "manager":
        // Manager sees work order completion
        const totalWorkOrders = stats.workOrdersCount || 1;
        const completedWorkOrders = stats.workOrdersCompleted || 0;
        return {
          percentage: Math.round((completedWorkOrders / totalWorkOrders) * 100),
          label: "Work Orders Completion",
          current: completedWorkOrders,
          total: totalWorkOrders
        };
      default:
        // Other roles see their task completion
        const myTasks = 5; // Could be fetched from API
        const myCompleted = 3;
        return {
          percentage: Math.round((myCompleted / myTasks) * 100),
          label: "My Tasks Progress",
          current: myCompleted,
          total: myTasks
        };
    }
  };

  const progress = getUserProgress();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Here's your personalized dashboard overview.
        </p>
      </div>

      {/* Personal Progress Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <TrendingUp className="h-5 w-5 mr-2" />
            {progress.label}
          </CardTitle>
          <CardDescription className="text-blue-700">
            Your current progress and performance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {progress.current} of {progress.total} completed
              </span>
              <span className="text-2xl font-bold text-blue-900">
                {progress.percentage}%
              </span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
            <div className="flex justify-between text-xs text-blue-700">
              <span>Started</span>
              <span>In Progress</span>
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
