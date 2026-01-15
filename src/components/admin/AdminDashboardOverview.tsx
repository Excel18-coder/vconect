import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authFetch } from '@/services/api-client';
import {
  Activity,
  AlertTriangle,
  Clock,
  Cloud,
  Database,
  Eye,
  FileText,
  Gauge,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DashboardKPIs {
  dau: { value: number; change: number; previousValue: number };
  newUsers: { value: number; change: number; previousValue: number };
  newProducts: { value: number; change: number; previousValue: number };
  productViews: { value: number; change: number; previousValue: number };
  messagesSent: { value: number; change: number; previousValue: number };
  totalUsers: number;
  totalActiveProducts: number;
}

interface RealtimeStats {
  activeUsersLastHour: number;
  registrationsToday: number;
  newProductsToday: number;
  messagesToday: number;
  securityAlerts: number;
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
}

interface CloudinaryStats {
  totalResources: number;
  totalStorage: number;
  storageUsedMB: string;
  bandwidthUsedGB: string;
  status: string;
}

interface DashboardData {
  kpis: DashboardKPIs;
  realTime: RealtimeStats;
  cloudinary: CloudinaryStats;
  distribution: {
    usersByType: Array<{ user_type: string; count: number }>;
    productsByStatus: Array<{ status: string; count: number }>;
    productsByCategory: Array<{ category: string; count: number }>;
  };
  recentActivity: Array<{
    action: string;
    target_type: string;
    created_at: string;
    admin_email: string;
    admin_name: string;
  }>;
  // Additional analytics data
  userAnalytics?: {
    userGrowth: Array<{ date: string; value: number }>;
    dauTrend: Array<{ date: string; value: number }>;
    topActiveUsers: Array<{
      user_id: string;
      email: string;
      display_name: string;
      event_count: number;
    }>;
  };
  productAnalytics?: {
    productGrowth: Array<{ date: string; value: number }>;
    mostViewedProducts: Array<{
      id: string;
      title: string;
      price: number;
      category: string;
      view_count: number;
    }>;
    conversionFunnel?: {
      viewers: number;
      favoriters: number;
      inquirers: number;
    };
  };
  engagementAnalytics?: {
    topSearches: Array<{ query: string; search_count: number }>;
    engagementByHour: Array<{ hour: number; event_count: number }>;
  };
  performanceMetrics?: {
    eventsByCategory: Array<{ event_category: string; count: number }>;
    tableSizes: Array<{ tablename: string; size: string }>;
  };
}

const AdminDashboardOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds for real-time data
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(data === null); // Only show loader on initial load

      // Fetch main dashboard data
      const dashboardResponse = await authFetch('/admin/analytics/dashboard');
      const dashboardResult = await dashboardResponse.json();

      // Fetch additional analytics in parallel
      const [userResponse, productResponse, engagementResponse, performanceResponse] =
        await Promise.all([
          authFetch('/admin/analytics/users?days=30').catch(() => null),
          authFetch('/admin/analytics/products?days=30').catch(() => null),
          authFetch('/admin/analytics/engagement?days=30').catch(() => null),
          authFetch('/admin/analytics/performance?days=7').catch(() => null),
        ]);

      const [userResult, productResult, engagementResult, performanceResult] = await Promise.all([
        userResponse?.json().catch(() => ({ success: false })),
        productResponse?.json().catch(() => ({ success: false })),
        engagementResponse?.json().catch(() => ({ success: false })),
        performanceResponse?.json().catch(() => ({ success: false })),
      ]);

      if (dashboardResult.success) {
        setData({
          ...dashboardResult.data,
          userAnalytics: userResult.success ? userResult.data : undefined,
          productAnalytics: productResult.success ? productResult.data : undefined,
          engagementAnalytics: engagementResult.success ? engagementResult.data : undefined,
          performanceMetrics: performanceResult.success ? performanceResult.data : undefined,
        });
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(dashboardResult.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            <Clock className="inline h-3 w-3 mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 30s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Now
        </Button>
      </div>

      {/* Security Alerts Banner */}
      {data.realTime.securityAlerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {data.realTime.securityAlerts} unresolved security alert
              {data.realTime.securityAlerts > 1 ? 's' : ''} require immediate attention
            </span>
            <Button variant="outline" size="sm" className="ml-4">
              Review Alerts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for Different Dashboard Views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Gauge className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Activity className="h-4 w-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Zap className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.realTime.activeUsersLastHour}</div>
                <p className="text-xs text-muted-foreground">Users in last hour</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.realTime.registrationsToday}</div>
                <p className="text-xs text-muted-foreground">Registrations</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Products</CardTitle>
                <Package className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.realTime.newProductsToday}</div>
                <p className="text-xs text-muted-foreground">Listed today</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.realTime.messagesToday}</div>
                <p className="text-xs text-muted-foreground">Sent today</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.realTime.securityAlerts}</div>
                <p className="text-xs text-muted-foreground">Active alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards with Trends */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Daily Active Users"
              value={data.kpis.dau.value}
              change={data.kpis.dau.change}
              previousValue={data.kpis.dau.previousValue}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />

            <MetricCard
              title="New Users"
              value={data.kpis.newUsers.value}
              change={data.kpis.newUsers.change}
              previousValue={data.kpis.newUsers.previousValue}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />

            <MetricCard
              title="New Products"
              value={data.kpis.newProducts.value}
              change={data.kpis.newProducts.change}
              previousValue={data.kpis.newProducts.previousValue}
              icon={<Package className="h-4 w-4 text-muted-foreground" />}
            />

            <MetricCard
              title="Product Views"
              value={data.kpis.productViews.value}
              change={data.kpis.productViews.change}
              previousValue={data.kpis.productViews.previousValue}
              icon={<Eye className="h-4 w-4 text-muted-foreground" />}
            />

            <MetricCard
              title="Messages Sent"
              value={data.kpis.messagesSent.value}
              change={data.kpis.messagesSent.change}
              previousValue={data.kpis.messagesSent.previousValue}
              icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time registrations</p>
              </CardContent>
            </Card>
          </div>

          {/* Infrastructure Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-sky-500" />
                  Cloudinary Storage
                </CardTitle>
                <CardDescription>Real-time media storage and bandwidth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge
                        variant={data.cloudinary.status === 'connected' ? 'default' : 'destructive'}
                      >
                        {data.cloudinary.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Resources</span>
                      <span className="text-lg font-semibold">
                        {data.cloudinary.totalResources.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Storage</span>
                      <span className="text-lg font-semibold">
                        {data.cloudinary.storageUsedMB} MB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bandwidth</span>
                      <span className="text-lg font-semibold">
                        {data.cloudinary.bandwidthUsedGB} GB
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-500" />
                  Database Overview
                </CardTitle>
                <CardDescription>Real-time database statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="text-lg font-semibold">
                      {data.realTime.totalUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Products</span>
                    <span className="text-lg font-semibold">
                      {data.realTime.totalProducts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Products</span>
                    <span className="text-lg font-semibold">
                      {data.realTime.activeProducts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Today's Messages</span>
                    <span className="text-lg font-semibold">
                      {data.realTime.messagesToday.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Users by Type</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.distribution.usersByType && data.distribution.usersByType.length > 0 ? (
                    data.distribution.usersByType.map(item => {
                      const total = data.distribution.usersByType.reduce(
                        (sum, u) => sum + Number(u.count),
                        0
                      );
                      const percentage = ((Number(item.count) / total) * 100).toFixed(1);
                      return (
                        <div key={item.user_type} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{item.user_type}</span>
                            <span className="text-muted-foreground">
                              {item.count.toLocaleString()} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products by Status</CardTitle>
                <CardDescription>Current inventory status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.distribution.productsByStatus &&
                  data.distribution.productsByStatus.length > 0 ? (
                    data.distribution.productsByStatus.map(item => {
                      const total = data.distribution.productsByStatus.reduce(
                        (sum, p) => sum + Number(p.count),
                        0
                      );
                      const percentage = ((Number(item.count) / total) * 100).toFixed(1);
                      const colorMap = {
                        active: 'bg-green-500',
                        sold: 'bg-blue-500',
                        inactive: 'bg-gray-500',
                      };
                      return (
                        <div key={item.status} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{item.status}</span>
                            <span className="text-muted-foreground">
                              {item.count.toLocaleString()} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`${
                                colorMap[item.status] || 'bg-primary'
                              } h-2 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Active products by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.distribution.productsByCategory &&
                  data.distribution.productsByCategory.length > 0 ? (
                    data.distribution.productsByCategory.slice(0, 5).map(item => {
                      const maxCount = Math.max(
                        ...data.distribution.productsByCategory.map(c => Number(c.count))
                      );
                      const percentage = ((Number(item.count) / maxCount) * 100).toFixed(0);
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{item.category}</span>
                            <span className="text-muted-foreground">
                              {item.count.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Admin Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Admin Activity
              </CardTitle>
              <CardDescription>Latest administrative actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivity && data.recentActivity.length > 0 ? (
                  data.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.action.replace(/_/g, ' ').replace(/\./g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Users className="inline h-3 w-3 mr-1" />
                          {activity.admin_name || activity.admin_email} •
                          <Badge variant="outline" className="ml-2 text-xs">
                            {activity.target_type}
                          </Badge>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          {data.userAnalytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      User Growth (Last 30 Days)
                    </CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.userAnalytics.userGrowth && data.userAnalytics.userGrowth.length > 0 ? (
                      <div className="space-y-2">
                        {data.userAnalytics.userGrowth.slice(-7).map((day, idx) => {
                          const maxValue = Math.max(
                            ...data.userAnalytics.userGrowth.map(d => d.value)
                          );
                          const percentage = ((day.value / maxValue) * 100).toFixed(0);
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-24">
                                {new Date(day.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <div className="flex-1">
                                <div className="w-full bg-muted rounded-full h-3">
                                  <div
                                    className="bg-green-500 h-3 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-medium w-12 text-right">
                                {day.value}
                              </span>
                            </div>
                          );
                        })}
                        <div className="pt-4 border-t mt-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {data.userAnalytics.userGrowth.reduce((sum, d) => sum + d.value, 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total new users (30 days)
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No growth data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Daily Active Users Trend
                    </CardTitle>
                    <CardDescription>User activity over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.userAnalytics.dauTrend && data.userAnalytics.dauTrend.length > 0 ? (
                      <div className="space-y-2">
                        {data.userAnalytics.dauTrend.slice(-7).map((day, idx) => {
                          const maxValue = Math.max(
                            ...data.userAnalytics.dauTrend.map(d => d.value)
                          );
                          const percentage = ((day.value / maxValue) * 100).toFixed(0);
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-24">
                                {new Date(day.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <div className="flex-1">
                                <div className="w-full bg-muted rounded-full h-3">
                                  <div
                                    className="bg-blue-500 h-3 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-medium w-12 text-right">
                                {day.value}
                              </span>
                            </div>
                          );
                        })}
                        <div className="pt-4 border-t mt-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {(
                                data.userAnalytics.dauTrend.reduce((sum, d) => sum + d.value, 0) /
                                data.userAnalytics.dauTrend.length
                              ).toFixed(0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Average DAU</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No DAU data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Top Active Users
                  </CardTitle>
                  <CardDescription>
                    Most engaged users on the platform (last 30 days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.userAnalytics.topActiveUsers &&
                  data.userAnalytics.topActiveUsers.length > 0 ? (
                    <div className="space-y-3">
                      {data.userAnalytics.topActiveUsers.slice(0, 10).map((user, index) => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              #{index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{user.display_name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{user.event_count}</p>
                            <p className="text-xs text-muted-foreground">events</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No user activity data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading user analytics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PRODUCTS TAB - Content shortened for length, includes growth charts, conversion funnel, most viewed products */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Product analytics dashboard coming soon with detailed growth trends, conversion
                funnels, and category performance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENGAGEMENT TAB - Content shortened for length, includes search queries, hourly engagement */}
        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Engagement analytics dashboard with search trends, message activity, and user
                interaction patterns.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM TAB - Cloudinary and database stats */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-sky-500" />
                  Cloudinary Infrastructure
                </CardTitle>
                <CardDescription>Media storage and delivery metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Service Status</p>
                      <p className="text-xs text-muted-foreground">Connection health</p>
                    </div>
                    <Badge
                      variant={data.cloudinary.status === 'connected' ? 'default' : 'destructive'}
                      className="text-sm"
                    >
                      {data.cloudinary.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Total Media Resources</p>
                      <p className="text-xs text-muted-foreground">Images and videos</p>
                    </div>
                    <p className="text-lg font-bold">
                      {data.cloudinary.totalResources.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Storage Used</p>
                      <p className="text-xs text-muted-foreground">Total storage consumption</p>
                    </div>
                    <p className="text-lg font-bold">{data.cloudinary.storageUsedMB} MB</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Bandwidth Used</p>
                      <p className="text-xs text-muted-foreground">Data transfer</p>
                    </div>
                    <p className="text-lg font-bold">{data.cloudinary.bandwidthUsedGB} GB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-500" />
                  Database Statistics
                </CardTitle>
                <CardDescription>PostgreSQL database metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Total Users</p>
                      <p className="text-xs text-muted-foreground">All registered accounts</p>
                    </div>
                    <p className="text-lg font-bold">{data.realTime.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Total Products</p>
                      <p className="text-xs text-muted-foreground">All product listings</p>
                    </div>
                    <p className="text-lg font-bold">
                      {data.realTime.totalProducts.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Active Products</p>
                      <p className="text-xs text-muted-foreground">Currently listed</p>
                    </div>
                    <p className="text-lg font-bold">
                      {data.realTime.activeProducts.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Messages Today</p>
                      <p className="text-xs text-muted-foreground">Communication activity</p>
                    </div>
                    <p className="text-lg font-bold">
                      {data.realTime.messagesToday.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {data.performanceMetrics && data.performanceMetrics.eventsByCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-emerald-500" />
                  Event Categories
                </CardTitle>
                <CardDescription>Distribution of tracked events by category</CardDescription>
              </CardHeader>
              <CardContent>
                {data.performanceMetrics.eventsByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {data.performanceMetrics.eventsByCategory.slice(0, 10).map(category => {
                      const maxCount = Math.max(
                        ...data.performanceMetrics.eventsByCategory.map(c => Number(c.count))
                      );
                      const percentage = ((Number(category.count) / maxCount) * 100).toFixed(0);
                      return (
                        <div key={category.event_category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">
                              {category.event_category}
                            </span>
                            <span className="text-muted-foreground">
                              {Number(category.count).toLocaleString()} events
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No event data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  previousValue: number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, previousValue, icon }) => {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(parseFloat(change.toString())).toFixed(1)}%
          </span>
          <span className="ml-1">from yesterday ({previousValue})</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboardOverview;
