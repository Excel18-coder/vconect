import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authFetch } from '@/services/api-client';
import {
  Activity,
  Cloud,
  Database,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
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
      const response = await authFetch('/admin/analytics/dashboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(result.message || 'Failed to load dashboard data');
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
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 30s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Alerts Banner */}
      {data.realTime.securityAlerts > 0 && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {data.realTime.securityAlerts} unresolved security alert
            {data.realTime.securityAlerts > 1 ? 's' : ''} require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (1h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.realTime.activeUsersLastHour}</div>
            <p className="text-xs text-muted-foreground">Users active in last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.realTime.registrationsToday}</div>
            <p className="text-xs text-muted-foreground">Registrations today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Products Today</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.realTime.newProductsToday}</div>
            <p className="text-xs text-muted-foreground">Products listed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.realTime.messagesToday}</div>
            <p className="text-xs text-muted-foreground">Messages sent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.realTime.securityAlerts}</div>
            <p className="text-xs text-muted-foreground">Unresolved alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Cloudinary Storage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloudinary Storage Stats
          </CardTitle>
          <CardDescription>Real-time media storage and bandwidth usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    data.cloudinary.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <p className="text-lg font-semibold capitalize">{data.cloudinary.status}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Resources</p>
              <p className="text-lg font-semibold">
                {data.cloudinary.totalResources.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-lg font-semibold">{data.cloudinary.storageUsedMB} MB</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bandwidth Used</p>
              <p className="text-lg font-semibold">{data.cloudinary.bandwidthUsedGB} GB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Overview
          </CardTitle>
          <CardDescription>Real-time database statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-lg font-semibold">{data.realTime.totalUsers.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-lg font-semibold">
                {data.realTime.totalProducts.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Products</p>
              <p className="text-lg font-semibold">
                {data.realTime.activeProducts.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Messages Today</p>
              <p className="text-lg font-semibold">
                {data.realTime.messagesToday.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
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
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
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
            <p className="text-xs text-muted-foreground">All registered users</p>
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
            <div className="space-y-2">
              {data.distribution.usersByType.map(item => (
                <div key={item.user_type} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{item.user_type}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products by Status</CardTitle>
            <CardDescription>Current product inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.distribution.productsByStatus.map(item => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{item.status}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Active products by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.distribution.productsByCategory?.map(item => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{item.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Admin Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>Latest administrative actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {activity.action.replace(/_/g, ' ').replace(/\./g, ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.admin_name || activity.admin_email} • {activity.target_type}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
