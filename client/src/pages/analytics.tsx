import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Wrench, 
  Calendar, 
  BarChart3, 
  Activity,
  Target,
  Award,
  AlertCircle
} from "lucide-react";

export default function Analytics() {
  const { data: workOrders } = useQuery({ queryKey: ["/api/work-orders"] });
  const { data: technicians } = useQuery({ queryKey: ["/api/technicians"] });
  const { data: invoices } = useQuery({ queryKey: ["/api/invoices"] });
  const { data: proposals } = useQuery({ queryKey: ["/api/proposals/all"] });
  const { data: users } = useQuery({ queryKey: ["/api/users"] });
  const { data: stats } = useQuery({ queryKey: ["/api/dashboard/stats"] });

  // Process data for charts
  const processWorkOrderData = () => {
    if (!workOrders) return [];
    
    const statusCounts = workOrders.reduce((acc: any, wo: any) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round(((count as number) / workOrders.length) * 100)
    }));
  };

  const processFinancialData = () => {
    if (!invoices || !proposals) return [];
    
    const financialData = invoices.map((invoice: any) => {
      const proposal = proposals.find((p: any) => p.workOrderId === invoice.workOrderId);
      return {
        workOrderId: invoice.workOrderId,
        invoiceAmount: invoice.totalAmount,
        proposalAmount: proposal?.totalAmount || 0,
        profit: invoice.totalAmount - (proposal?.totalAmount || 0),
        status: invoice.status
      };
    });

    return financialData;
  };

  const processTechnicianPerformance = () => {
    if (!technicians || !workOrders) return [];
    
    return technicians.map((tech: any) => {
      const techWorkOrders = workOrders.filter((wo: any) => wo.assignedTechnicianId === tech.id);
      const completedOrders = techWorkOrders.filter((wo: any) => wo.status === 'completed');
      
      return {
        name: `${tech.firstName} ${tech.lastName}`,
        totalOrders: techWorkOrders.length,
        completedOrders: completedOrders.length,
        completionRate: techWorkOrders.length > 0 ? Math.round((completedOrders.length / techWorkOrders.length) * 100) : 0,
        averageRating: tech.averageRating || 0,
        efficiency: Math.min(100, (completedOrders.length * 20) + (tech.averageRating * 10))
      };
    });
  };

  const processMonthlyTrends = () => {
    if (!workOrders) return [];
    
    const monthlyData = workOrders.reduce((acc: any, wo: any) => {
      const month = new Date(wo.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!acc[month]) {
        acc[month] = { month, created: 0, completed: 0, pending: 0 };
      }
      acc[month].created += 1;
      if (wo.status === 'completed') acc[month].completed += 1;
      if (wo.status === 'pending') acc[month].pending += 1;
      return acc;
    }, {});

    return Object.values(monthlyData);
  };

  const workOrderStatusData = processWorkOrderData();
  const financialData = processFinancialData();
  const technicianData = processTechnicianPerformance();
  const monthlyTrends = processMonthlyTrends();

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  // Calculate key metrics
  const totalRevenue = financialData.reduce((sum, item) => sum + item.invoiceAmount, 0);
  const totalProfit = financialData.reduce((sum, item) => sum + item.profit, 0);
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const averageRating = technicians?.reduce((sum: number, tech: any) => sum + (tech.averageRating || 0), 0) / (technicians?.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Advanced Analytics
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Comprehensive analysis and insights of your entire system
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-blue-700">From completed invoices</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{profitMargin}%</div>
            <p className="text-xs text-green-700">Average across all projects</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Avg Rating</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-purple-700">Technician performance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats?.workOrdersCount || 0}</div>
            <p className="text-xs text-orange-700">Work orders in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Work Order Status Distribution
                </CardTitle>
                <CardDescription>Current status breakdown of all work orders</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workOrderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {workOrderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Usage Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  System Usage Metrics
                </CardTitle>
                <CardDescription>Current system utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Users</span>
                    <span>{stats?.totalUsers || 0}</span>
                  </div>
                  <Progress value={((stats?.totalUsers || 0) / 50) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Technicians</span>
                    <span>{stats?.techniciansCount || 0}</span>
                  </div>
                  <Progress value={((stats?.techniciansCount || 0) / 20) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Work Order Completion</span>
                    <span>{stats?.workOrdersCompleted || 0}/{stats?.workOrdersCount || 0}</span>
                  </div>
                  <Progress 
                    value={stats?.workOrdersCount ? ((stats.workOrdersCompleted || 0) / stats.workOrdersCount) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Proposals */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Proposal Analysis</CardTitle>
                <CardDescription>Comparison of proposed vs actual revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="workOrderId" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="proposalAmount" fill="#3b82f6" name="Proposed" />
                    <Bar dataKey="invoiceAmount" fill="#10b981" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Profit/Loss Analysis</CardTitle>
                <CardDescription>Financial performance by project</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={financialData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="workOrderId" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">${totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-blue-700">Total Revenue</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">${totalProfit.toLocaleString()}</div>
                  <div className="text-sm text-green-700">Total Profit</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{profitMargin}%</div>
                  <div className="text-sm text-purple-700">Profit Margin</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Technician Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance Analysis</CardTitle>
              <CardDescription>Individual technician metrics and efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={technicianData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill="#3b82f6" name="Completion Rate %" />
                  <Bar dataKey="efficiency" fill="#10b981" name="Efficiency Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicianData.map((tech, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{tech.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Completion Rate</span>
                    <Badge variant="outline">{tech.completionRate}%</Badge>
                  </div>
                  <Progress value={tech.completionRate} className="h-2" />
                  <div className="flex justify-between">
                    <span className="text-xs">Rating</span>
                    <Badge variant="outline">{tech.averageRating}/5</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Orders</span>
                    <Badge variant="outline">{tech.totalOrders}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends Analysis</CardTitle>
              <CardDescription>Work order creation and completion trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Executive Summary Report */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary Report</CardTitle>
              <CardDescription>Comprehensive system overview and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">System Health</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Performance</span>
                      <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Satisfaction</span>
                      <Badge className="bg-blue-100 text-blue-800">{averageRating.toFixed(1)}/5</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Financial Health</span>
                      <Badge className={profitMargin > 10 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {profitMargin > 10 ? "Strong" : "Moderate"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Key Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    {profitMargin < 15 && (
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>Consider optimizing pricing strategy to improve profit margins</span>
                      </div>
                    )}
                    {averageRating < 4 && (
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Focus on technician training to improve service quality</span>
                      </div>
                    )}
                    <div className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span>Continue monitoring work order completion rates</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}