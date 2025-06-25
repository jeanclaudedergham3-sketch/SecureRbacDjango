import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, Wrench, DollarSign, Clock, 
  FileText, Award, MapPin, Calendar, Activity, BarChart3,
  PieChart as PieChartIcon, LineChart as LineChartIcon,
  Download, Filter, RefreshCw
} from "lucide-react";

interface AnalyticsData {
  workOrderStats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    cancelled: number;
    avgCompletionTime: number;
    urgentCount: number;
  };
  financialStats: {
    totalRevenue: number;
    totalCosts: number;
    profit: number;
    avgProjectValue: number;
    outstandingInvoices: number;
    paidInvoices: number;
  };
  technicianStats: {
    totalTechnicians: number;
    activeTechnicians: number;
    avgRating: number;
    totalRatings: number;
    topPerformers: Array<{
      id: number;
      name: string;
      rating: number;
      completedJobs: number;
    }>;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    roleDistribution: Array<{
      role: string;
      count: number;
    }>;
  };
  monthlyData: Array<{
    month: string;
    workOrders: number;
    revenue: number;
    costs: number;
    profit: number;
  }>;
  categoryData: Array<{
    category: string;
    count: number;
    avgTime: number;
    revenue: number;
  }>;
  priorityData: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  statusData: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState("last30days");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: analytics, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', dateRange, selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?range=${dateRange}&category=${selectedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">Failed to load analytics data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Work Orders",
      value: analytics.workOrderStats.total.toLocaleString(),
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Total Revenue",
      value: `$${analytics.financialStats.totalRevenue.toLocaleString()}`,
      change: "+8.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Active Technicians",
      value: analytics.technicianStats.activeTechnicians.toString(),
      change: "+3",
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Avg Completion Time",
      value: `${analytics.workOrderStats.avgCompletionTime}h`,
      change: "-15%",
      trend: "down",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Customer Satisfaction",
      value: `${analytics.technicianStats.avgRating.toFixed(1)}/5`,
      change: "+0.3",
      trend: "up",
      icon: Award,
      color: "text-yellow-600"
    },
    {
      title: "Profit Margin",
      value: `${((analytics.financialStats.profit / analytics.financialStats.totalRevenue) * 100).toFixed(1)}%`,
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
      color: "text-emerald-600"
    },
    {
      title: "Pending Work Orders",
      value: analytics.workOrderStats.pending.toString(),
      change: "-5",
      trend: "down",
      icon: Activity,
      color: "text-red-600"
    },
    {
      title: "System Users",
      value: analytics.userStats.totalUsers.toString(),
      change: "+7",
      trend: "up",
      icon: Users,
      color: "text-indigo-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
              <SelectItem value="lastyear">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <div className="flex items-center mt-2">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="workorders">Work Orders</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Monthly Performance
                </CardTitle>
                <CardDescription>Work orders and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="workOrders" fill="#8884d8" name="Work Orders" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Work Order Status
                </CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest rated technicians</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.technicianStats.topPerformers.map((tech, index) => (
                    <div key={tech.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-sm text-gray-600">{tech.completedJobs} jobs completed</p>
                      </div>
                      <Badge variant="secondary">{tech.rating.toFixed(1)} ⭐</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Work orders by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryData.map((cat, index) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{cat.category}</span>
                        <span>{cat.count} orders</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(cat.count / Math.max(...analytics.categoryData.map(c => c.count))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-600">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Costs</CardTitle>
                <CardDescription>Monthly financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Revenue" />
                    <Area type="monotone" dataKey="costs" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Costs" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Trend</CardTitle>
                <CardDescription>Monthly profit analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke="#ff7300" strokeWidth={3} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Labor Costs</span>
                    <span className="font-bold">${(analytics.financialStats.totalRevenue * 0.6).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Material Costs</span>
                    <span className="font-bold">${(analytics.financialStats.totalRevenue * 0.3).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Additional Costs</span>
                    <span className="font-bold">${(analytics.financialStats.totalRevenue * 0.1).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Paid Invoices</span>
                    <Badge variant="secondary">{analytics.financialStats.paidInvoices}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outstanding</span>
                    <Badge variant="destructive">{analytics.financialStats.outstandingInvoices}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Project Value</span>
                    <span className="font-bold">${analytics.financialStats.avgProjectValue.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Revenue</span>
                    <span className="font-bold text-green-600">${analytics.financialStats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Costs</span>
                    <span className="font-bold text-red-600">${analytics.financialStats.totalCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-bold">Net Profit</span>
                    <span className="font-bold text-blue-600">${analytics.financialStats.profit.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workorders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Work orders by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ priority, percentage }) => `${priority} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
                <CardDescription>Performance by work order category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Count" />
                    <Bar dataKey="avgTime" fill="#82ca9d" name="Avg Time (hrs)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.workOrderStats.completed}</div>
                  <div className="text-sm text-gray-600">Total Completed</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.workOrderStats.inProgress}</div>
                  <div className="text-sm text-gray-600">Currently Active</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{analytics.workOrderStats.pending}</div>
                  <div className="text-sm text-gray-600">Awaiting Assignment</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Urgent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{analytics.workOrderStats.urgentCount}</div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Technician Performance</CardTitle>
                <CardDescription>Rating vs completed jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="completedJobs" name="Completed Jobs" />
                    <YAxis type="number" dataKey="rating" name="Rating" domain={[0, 5]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Technicians" data={analytics.technicianStats.topPerformers} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workload Distribution</CardTitle>
                <CardDescription>Jobs assigned per technician</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.technicianStats.topPerformers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completedJobs" fill="#82ca9d" name="Completed Jobs" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Technicians</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">{analytics.technicianStats.totalTechnicians}</div>
                  <div className="text-sm text-gray-600">Registered</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.technicianStats.activeTechnicians}</div>
                  <div className="text-sm text-gray-600">Currently Working</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{analytics.technicianStats.avgRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Out of 5 ⭐</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">{analytics.technicianStats.totalRatings}</div>
                  <div className="text-sm text-gray-600">Customer Reviews</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: 'Efficiency', A: 85, fullMark: 100 },
                    { subject: 'Quality', A: 92, fullMark: 100 },
                    { subject: 'Speed', A: 78, fullMark: 100 },
                    { subject: 'Satisfaction', A: 88, fullMark: 100 },
                    { subject: 'Cost Control', A: 82, fullMark: 100 },
                    { subject: 'Reliability', A: 90, fullMark: 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trends</CardTitle>
                <CardDescription>Monthly completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="workOrders" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Completion Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>On-Time Completion</span>
                    <Badge variant="secondary">94%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>First-Time Fix Rate</span>
                    <Badge variant="secondary">87%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Resource Utilization</span>
                    <Badge variant="secondary">82%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Customer Satisfaction</span>
                    <Badge variant="secondary">4.2/5</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rework Rate</span>
                    <Badge variant="secondary">3%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Defect Rate</span>
                    <Badge variant="secondary">1.2%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Cost Per Work Order</span>
                    <Badge variant="secondary">$245</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget Variance</span>
                    <Badge variant="secondary">-5%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI</span>
                    <Badge variant="secondary">125%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Growth</CardTitle>
                <CardDescription>Annual performance comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="workOrders" stroke="#8884d8" name="2025" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Patterns</CardTitle>
                <CardDescription>Workload distribution throughout the year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="workOrders" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>Forecasted trends and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Next Month Forecast</h3>
                  <p className="text-2xl font-bold text-blue-600">+15%</p>
                  <p className="text-sm text-blue-600">Expected work order increase</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800">Revenue Projection</h3>
                  <p className="text-2xl font-bold text-green-600">$125K</p>
                  <p className="text-sm text-green-600">Projected monthly revenue</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-800">Capacity Planning</h3>
                  <p className="text-2xl font-bold text-orange-600">85%</p>
                  <p className="text-sm text-orange-600">Resource utilization target</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}