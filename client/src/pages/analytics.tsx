import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Wrench, DollarSign, Clock,
  FileText, Award, Activity, BarChart3, PieChart as PieChartIcon,
  RefreshCw, CheckCircle, XCircle, AlertTriangle, Package, CreditCard,
  ArrowUpCircle, ArrowDownCircle, Minus
} from "lucide-react";
import { PageGuard } from "@/components/rbac/advanced-permission-guard";

interface ProposalVsInvoiceItem {
  workOrderId: number;
  workOrderNumber: string;
  clientName: string;
  status: string;
  proposalTotal: number;
  invoiceTotal: number;
  diff: number;
  result: "under_budget" | "over_budget" | "exact";
  hasProposal: boolean;
  hasInvoice: boolean;
  invoiceStatus: string | null;
}

interface AnalyticsData {
  workOrderStats: {
    total: number; completed: number; pending: number;
    inProgress: number; cancelled: number; avgCompletionTime: number; urgentCount: number;
  };
  financialStats: {
    totalRevenue: number; totalCosts: number; profit: number; avgProjectValue: number;
    outstandingInvoices: number; paidInvoices: number; approvedInvoices: number;
    totalLaborCost: number; totalMaterialCost: number;
  };
  technicianStats: {
    totalTechnicians: number; activeTechnicians: number; avgRating: number; totalRatings: number;
    topPerformers: Array<{ id: number; name: string; rating: number; completedJobs: number }>;
  };
  userStats: {
    totalUsers: number; activeUsers: number;
    roleDistribution: Array<{ role: string; count: number }>;
  };
  monthlyData: Array<{ month: string; workOrders: number; revenue: number; costs: number; profit: number }>;
  categoryData: Array<{ category: string; count: number; avgTime: number; revenue: number }>;
  priorityData: Array<{ priority: string; count: number; percentage: number }>;
  statusData: Array<{ status: string; count: number; color: string; percentage: number }>;
  allPaymentsList: Array<{
    id: number; workOrderNumber: string; clientName: string;
    amountRequested: number; amountApproved: number; status: string; createdAt: string;
  }>;
  proposalVsInvoice: ProposalVsInvoiceItem[];
  proposalVsSummary: {
    totalCompared: number; underBudgetCount: number; overBudgetCount: number;
    exactCount: number; totalSaved: number; totalOverspent: number; netResult: number;
  };
  recentActivity: Array<{ id: number; type: string; description: string; timestamp: string; user: string }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#ffc658", "#a4de6c"];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending:        { label: "Pending",        color: "bg-yellow-100 text-yellow-800" },
  approved:       { label: "Approved",       color: "bg-blue-100 text-blue-800" },
  paid:           { label: "Paid",           color: "bg-green-100 text-green-800" },
  partially_paid: { label: "Partial",        color: "bg-purple-100 text-purple-800" },
  rejected:       { label: "Rejected",       color: "bg-red-100 text-red-800" },
};

export default function Analytics() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState("last30days");

  const { data: analytics, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", dateRange],
    queryFn: async () => {
      const r = await fetch(`/api/analytics?range=${dateRange}`);
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-medium">Failed to load analytics.</p>
            <p className="text-sm text-gray-500 mt-1">{String(error || "Unknown error")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const a = analytics;
  const profitMargin = a.financialStats.totalRevenue > 0
    ? ((a.financialStats.profit / a.financialStats.totalRevenue) * 100).toFixed(1)
    : "0.0";

  return (
    <PageGuard pageName="analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Live data from all work orders, payments, and invoices</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Work Orders",      value: a.workOrderStats.total,                   icon: FileText,    color: "text-blue-600",    bg: "bg-blue-50" },
            { label: "Completed",        value: a.workOrderStats.completed,               icon: CheckCircle, color: "text-green-600",   bg: "bg-green-50" },
            { label: "In Progress",      value: a.workOrderStats.inProgress,              icon: Activity,    color: "text-orange-600",  bg: "bg-orange-50" },
            { label: "Total Revenue",    value: fmt(a.financialStats.totalRevenue),        icon: DollarSign,  color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Payments",   value: fmt(a.financialStats.totalCosts),          icon: CreditCard,  color: "text-purple-600",  bg: "bg-purple-50" },
            { label: "Profit Margin",    value: `${profitMargin}%`,                        icon: TrendingUp,  color: "text-blue-700",    bg: "bg-blue-50" },
            { label: "Technicians",      value: a.technicianStats.activeTechnicians,       icon: Users,       color: "text-indigo-600",  bg: "bg-indigo-50" },
            { label: "Avg Rating",       value: `${a.technicianStats.avgRating}/5 ⭐`,     icon: Award,       color: "text-yellow-600",  bg: "bg-yellow-50" },
          ].map(k => (
            <Card key={k.label} className={`${k.bg} border-0`}>
              <CardContent className="p-4">
                <k.icon className={`h-5 w-5 mb-2 ${k.color}`} />
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="payments">All Payments</TabsTrigger>
            <TabsTrigger value="proposal-vs-invoice">Proposal vs Invoice</TabsTrigger>
            <TabsTrigger value="technicians">Technicians</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Monthly Work Orders</CardTitle>
                  <CardDescription>Work order volume per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={a.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="workOrders" fill="#8884d8" name="Work Orders" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Work Order Status</CardTitle>
                  <CardDescription>Current distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={a.statusData} cx="50%" cy="50%" outerRadius={90}
                        dataKey="count" label={({ status, percentage }) => `${status} (${percentage}%)`}
                        labelLine={false}>
                        {a.statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Top Technicians</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {a.technicianStats.topPerformers.slice(0, 6).map((t, i) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm w-5">{i + 1}.</span>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-gray-500">{t.completedJobs} completed</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{t.rating.toFixed(1)} ⭐</Badge>
                      </div>
                    ))}
                    {a.technicianStats.topPerformers.length === 0 && (
                      <p className="text-sm text-gray-400 italic">No technician data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {a.categoryData.slice(0, 6).map(cat => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{cat.category}</span>
                          <span className="font-medium ml-2">{cat.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{
                            width: `${a.categoryData.length > 0 ? (cat.count / Math.max(...a.categoryData.map(c => c.count))) * 100 : 0}%`
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {a.recentActivity.slice(0, 6).map(act => (
                      <div key={act.id} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm">{act.description}</p>
                          <p className="text-xs text-gray-500">{act.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Financial ── */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Invoice Revenue", value: fmt(a.financialStats.totalRevenue), icon: DollarSign, color: "text-green-700", bg: "bg-green-50 border-green-200" },
                { label: "Total Technician Payments", value: fmt(a.financialStats.totalCosts), icon: CreditCard, color: "text-red-700", bg: "bg-red-50 border-red-200" },
                { label: "Net Profit", value: fmt(a.financialStats.profit), icon: TrendingUp, color: a.financialStats.profit >= 0 ? "text-blue-700" : "text-red-700", bg: "bg-blue-50 border-blue-200" },
              ].map(s => (
                <Card key={s.label} className={`border ${s.bg}`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <s.icon className={`h-8 w-8 ${s.color}`} />
                    <div>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-sm text-gray-600">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Costs Over Time</CardTitle>
                  <CardDescription>Monthly comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={a.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#dcfce7" name="Revenue" />
                      <Area type="monotone" dataKey="costs" stroke="#ef4444" fill="#fee2e2" name="Payments" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Profit</CardTitle>
                  <CardDescription>Revenue minus technician payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={a.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => fmt(v)} />
                      <Bar dataKey="profit" name="Profit" radius={[4,4,0,0]}
                        fill="#3b82f6"
                        label={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Invoice Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Approved (pending payment)", value: a.financialStats.approvedInvoices, color: "text-blue-600" },
                    { label: "Paid", value: a.financialStats.paidInvoices, color: "text-green-600" },
                    { label: "Outstanding / Pending", value: a.financialStats.outstandingInvoices, color: "text-orange-600" },
                    { label: "Avg Invoice Value", value: fmt(a.financialStats.avgProjectValue), color: "text-gray-800" },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{s.label}</span>
                      <span className={`font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Cost Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Labor (approved invoices)", value: fmt(a.financialStats.totalLaborCost), color: "text-purple-700" },
                    { label: "Materials (approved invoices)", value: fmt(a.financialStats.totalMaterialCost), color: "text-orange-700" },
                    { label: "Technician payments out", value: fmt(a.financialStats.totalCosts), color: "text-red-700" },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{s.label}</span>
                      <span className={`font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Work Order Volume</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={a.statusData} cx="50%" cy="50%" outerRadius={60} dataKey="count">
                        {a.statusData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, name) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── All Payments ── */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">All Technician Payments</h2>
                <p className="text-sm text-gray-500">{a.allPaymentsList.length} payments in the system</p>
              </div>
              <div className="flex gap-3 text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-lg font-bold text-green-700">{fmt(a.financialStats.totalCosts)}</p>
                  <p className="text-xs text-gray-500">Total Paid Out</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                  <p className="text-lg font-bold text-blue-700">{a.allPaymentsList.length}</p>
                  <p className="text-xs text-gray-500">Total Payments</p>
                </div>
              </div>
            </div>

            {a.allPaymentsList.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No payments in the system yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {a.allPaymentsList.map(p => {
                  const cfg = PAYMENT_STATUS[p.status] || { label: p.status, color: "bg-gray-100 text-gray-700" };
                  return (
                    <Card key={p.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{p.workOrderNumber}</p>
                              <p className="text-xs text-gray-500">{p.clientName} · {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Requested</p>
                              <p className="font-medium">{fmt(p.amountRequested)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Approved</p>
                              <p className="font-semibold text-green-700">{p.amountApproved > 0 ? fmt(p.amountApproved) : "—"}</p>
                            </div>
                            <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Proposal vs Invoice ── */}
          <TabsContent value="proposal-vs-invoice" className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-5 text-center">
                  <p className="text-2xl font-bold text-gray-800">{a.proposalVsSummary.totalCompared}</p>
                  <p className="text-sm text-gray-500 mt-1">Work Orders Compared</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <ArrowDownCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-green-700">{fmt(a.proposalVsSummary.totalSaved)}</p>
                      <p className="text-xs text-green-600">{a.proposalVsSummary.underBudgetCount} jobs under budget</p>
                      <p className="text-xs text-gray-500 mt-0.5">Invoice &lt; Proposal → We saved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-red-700">{fmt(a.proposalVsSummary.totalOverspent)}</p>
                      <p className="text-xs text-red-600">{a.proposalVsSummary.overBudgetCount} jobs over budget</p>
                      <p className="text-xs text-gray-500 mt-0.5">Invoice &gt; Proposal → We lost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={`border ${a.proposalVsSummary.netResult >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    {a.proposalVsSummary.netResult >= 0
                      ? <TrendingDown className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      : <TrendingUp className="h-8 w-8 text-orange-600 flex-shrink-0" />}
                    <div>
                      <p className={`text-xl font-bold ${a.proposalVsSummary.netResult >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                        {fmt(Math.abs(a.proposalVsSummary.netResult))}
                      </p>
                      <p className="text-xs text-gray-500">
                        {a.proposalVsSummary.netResult >= 0 ? "Net: Under budget overall" : "Net: Over budget overall"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {a.proposalVsInvoice.filter(i => i.hasProposal && i.hasInvoice).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Proposal vs Invoice Amount per Work Order</CardTitle>
                  <CardDescription>Blue = proposal estimate · Orange = actual invoice</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={a.proposalVsInvoice
                        .filter(i => i.hasProposal && i.hasInvoice)
                        .slice(0, 15)
                        .map(i => ({
                          name: i.workOrderNumber,
                          Proposal: i.proposalTotal,
                          Invoice: i.invoiceTotal,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="Proposal" fill="#3b82f6" radius={[4,4,0,0]} />
                      <Bar dataKey="Invoice" fill="#f97316" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Per work order list */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Work Order Breakdown</h3>
              {a.proposalVsInvoice.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No work orders with both a proposal and invoice yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Comparisons will appear once proposals and invoices exist for the same work order.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {a.proposalVsInvoice.map(item => {
                    const isUnder = item.result === "under_budget";
                    const isOver  = item.result === "over_budget";
                    const isExact = item.result === "exact";
                    return (
                      <Card key={item.workOrderId} className={`border-l-4 ${
                        isUnder ? "border-l-green-500" :
                        isOver  ? "border-l-red-500" :
                                  "border-l-gray-300"
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-center gap-4 justify-between">
                            <div>
                              <p className="font-bold text-gray-900">{item.workOrderNumber}</p>
                              <p className="text-sm text-gray-500">{item.clientName} · {item.status}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Proposal</p>
                                <p className="font-semibold text-blue-700">
                                  {item.hasProposal ? fmt(item.proposalTotal) : <span className="text-gray-400 italic">—</span>}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Invoice</p>
                                <p className="font-semibold text-orange-700">
                                  {item.hasInvoice
                                    ? <>{fmt(item.invoiceTotal)} <span className="text-xs text-gray-400">({item.invoiceStatus})</span></>
                                    : <span className="text-gray-400 italic">—</span>}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Difference</p>
                                {isUnder && (
                                  <div className="flex items-center justify-center gap-1 text-green-700 font-bold">
                                    <ArrowDownCircle className="h-4 w-4" />
                                    {fmt(item.diff)}
                                  </div>
                                )}
                                {isOver && (
                                  <div className="flex items-center justify-center gap-1 text-red-700 font-bold">
                                    <ArrowUpCircle className="h-4 w-4" />
                                    {fmt(item.diff)}
                                  </div>
                                )}
                                {isExact && (
                                  <div className="flex items-center justify-center gap-1 text-gray-500">
                                    <Minus className="h-4 w-4" />Exact
                                  </div>
                                )}
                                {!item.hasProposal || !item.hasInvoice ? (
                                  <span className="text-gray-400 text-xs italic">Incomplete</span>
                                ) : null}
                              </div>
                            </div>

                            <div>
                              {isUnder && (
                                <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs">
                                  ✓ Under Budget — We Saved {fmt(item.diff)}
                                </Badge>
                              )}
                              {isOver && (
                                <Badge className="bg-red-100 text-red-800 border border-red-300 text-xs">
                                  ✗ Over Budget — Lost {fmt(item.diff)}
                                </Badge>
                              )}
                              {isExact && (
                                <Badge className="bg-gray-100 text-gray-700 border text-xs">
                                  = On Budget
                                </Badge>
                              )}
                              {!item.hasProposal && (
                                <Badge className="bg-yellow-100 text-yellow-800 border text-xs">No Proposal</Badge>
                              )}
                              {!item.hasInvoice && (
                                <Badge className="bg-yellow-100 text-yellow-800 border text-xs">No Invoice Yet</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Technicians ── */}
          <TabsContent value="technicians" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Technicians", value: a.technicianStats.totalTechnicians, color: "text-gray-800" },
                { label: "Active", value: a.technicianStats.activeTechnicians, color: "text-green-700" },
                { label: "Avg Rating", value: `${a.technicianStats.avgRating}/5`, color: "text-yellow-700" },
                { label: "Total Reviews", value: a.technicianStats.totalRatings, color: "text-blue-700" },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-5 text-center">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Jobs Completed per Technician</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={a.technicianStats.topPerformers.filter(t => t.completedJobs > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completedJobs" fill="#82ca9d" name="Completed Jobs" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Technician Ratings</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    {a.technicianStats.topPerformers.slice(0, 8).map((t, i) => (
                      <div key={t.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t.name}</span>
                            <span className="font-medium">{t.rating.toFixed(1)} ⭐</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(t.rating / 5) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {a.technicianStats.topPerformers.length === 0 && (
                      <p className="text-sm text-gray-400 italic text-center py-4">No technician ratings yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageGuard>
  );
}
