import { Users, UserCheck, Shield, TrendingUp, ClipboardList, Wrench, DollarSign, Receipt, CheckCircle, Clock, AlertCircle, CreditCard, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvancedPermissionGuard, PageGuard } from "@/components/rbac/advanced-permission-guard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const ACTIVITY_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  work_order: { color: "bg-blue-500",   icon: ClipboardList, label: "Work Order" },
  user:        { color: "bg-green-500",  icon: Users,         label: "User"       },
  payment:     { color: "bg-orange-500", icon: CreditCard,    label: "Payment"    },
  invoice:     { color: "bg-purple-500", icon: Receipt,       label: "Invoice"    },
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const { user, role } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  const { data: activities = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/activity"],
    refetchInterval: 30000,
  });

  const getProgress = () => {
    if (!role || !stats) return { percentage: 0, label: "Loading...", current: 0, total: 1 };
    switch (role.name) {
      case "admin":
        const total = (stats.workOrdersCount || 1);
        const completed = stats.workOrdersCompleted || 0;
        return { percentage: Math.round((completed / total) * 100), label: "Work Orders Completion", current: completed, total };
      case "manager":
        const t = stats.workOrdersCount || 1;
        const c = stats.workOrdersCompleted || 0;
        return { percentage: Math.round((c / t) * 100), label: "Work Orders Completion", current: c, total: t };
      default:
        const pending = stats.workOrdersPending || 0;
        const all = stats.workOrdersCount || 1;
        return { percentage: Math.round(((all - pending) / all) * 100), label: "Orders Progress", current: all - pending, total: all };
    }
  };
  const progress = getProgress();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50", permission: "users.view" },
    { label: "Technicians", value: stats?.techniciansCount, icon: Wrench, color: "text-orange-600", bg: "bg-orange-50", permission: null },
    { label: "Active Roles", value: stats?.activeRoles, icon: UserCheck, color: "text-green-600", bg: "bg-green-50", permission: null },
    { label: "Total Work Orders", value: stats?.workOrdersCount, icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-50", permission: null },
    { label: "Completed Orders", value: stats?.workOrdersCompleted, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", permission: null },
    { label: "Pending Orders", value: stats?.workOrdersPending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", permission: null },
    { label: "Pending Payments", value: stats?.pendingPayments, icon: CreditCard, color: "text-red-600", bg: "bg-red-50", permission: "payments.list.view" },
    { label: "Pending Invoices", value: stats?.pendingInvoices, icon: Receipt, color: "text-purple-600", bg: "bg-purple-50", permission: "payments.list.view" },
  ];

  return (
    <PageGuard pageName="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Progress Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-blue-900 text-base">
              <TrendingUp className="h-5 w-5 mr-2" />
              {progress.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-32" /></div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">{progress.current} of {progress.total}</span>
                  <span className="text-2xl font-bold text-blue-900">{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const inner = (
              <Card key={card.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", card.bg)}>
                      <Icon className={cn("h-5 w-5", card.color)} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                      {statsLoading ? (
                        <Skeleton className="h-6 w-10 mt-1" />
                      ) : (
                        <p className="text-xl font-bold text-gray-900">{card.value ?? 0}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            return card.permission ? (
              <AdvancedPermissionGuard key={card.label} permission={card.permission}>{inner}</AdvancedPermissionGuard>
            ) : inner;
          })}
        </div>

        {/* Two-column bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Needs Attention */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Needs Attention
              </CardTitle>
              <CardDescription>Items requiring action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {statsLoading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)
              ) : (
                <>
                  {(stats?.pendingPayments ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Pending Payment Requests</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800 border-0">{stats.pendingPayments}</Badge>
                    </div>
                  )}
                  {(stats?.pendingInvoices ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Pending Invoices</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 border-0">{stats.pendingInvoices}</Badge>
                    </div>
                  )}
                  {(stats?.workOrdersPending ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Active / Pending Work Orders</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-0">{stats.workOrdersPending}</Badge>
                    </div>
                  )}
                  {(stats?.pendingPayments ?? 0) === 0 && (stats?.pendingInvoices ?? 0) === 0 && (stats?.workOrdersPending ?? 0) === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">All clear — nothing needs attention!</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Real Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-blue-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Live system events</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
              ) : (
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {activities.map((event: any) => {
                    const cfg = ACTIVITY_CONFIG[event.type] || { color: "bg-gray-400", icon: Activity, label: "Event" };
                    const Icon = cfg.icon;
                    return (
                      <li key={event.id} className="flex items-start gap-3">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", cfg.color)}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">{event.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(event.time)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </PageGuard>
  );
}
