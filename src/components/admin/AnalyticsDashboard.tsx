/**
 * Analytics Dashboard Component
 * Comprehensive analytics with real-time data from AdminDashboardOverview
 */

import AdminDashboardOverview from './AdminDashboardOverview';

export function AnalyticsDashboard() {
  return <AdminDashboardOverview />;
}

interface PlatformStats {
  dailyStats: Array<{
    date: string;
    registrations: number;
  }>;
  productGrowth: Array<{
    date: string;
    listings: number;
    category: string;
  }>;
  topSellers: Array<{
    email: string;
    display_name: string;
    product_count: number;
    total_views: number;
  }>;
  messageActivity: Array<{
    date: string;
    messages: number;
  }>;
}

interface DashboardStats {
  users: {
    total_users: number;
    buyers: number;
    sellers: number;
    landlords: number;
    new_users_30d: number;
    new_users_7d?: number;
    growth_rate?: number;
  };
  products: {
    total_products: number;
    active_products: number;
    sold_products: number;
    inactive_products: number;
    new_products_30d: number;
    total_views: number;
    avg_price?: number;
  };
  messages: {
    total_messages: number;
    unread_messages: number;
    messages_30d: number;
    response_rate?: number;
  };
  categories: Array<{
    category: string;
    product_count: number;
    total_views: number;
  }>;
}

export function AnalyticsDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, [dateRange]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const dashboardRes = await authFetch('/admin/dashboard/stats');
      const dashboardData = await dashboardRes.json();

      // Fetch platform stats
      const platformRes = await authFetch(`/admin/stats/platform?days=${dateRange}`);
      const platformData = await platformRes.json();

      if (dashboardData.success) {
        setDashboardStats(dashboardData.data);
      }

      if (platformData.success) {
        setPlatformStats(platformData.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading || !dashboardStats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const keyMetrics = [
    {
      title: 'Total Users',
      value: dashboardStats.users.total_users,
      change: dashboardStats.users.new_users_30d,
      changeLabel: 'new this month',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Active Products',
      value: dashboardStats.products.active_products,
      change: dashboardStats.products.new_products_30d,
      changeLabel: 'new this month',
      icon: Package,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Views',
      value: Number(dashboardStats.products.total_views),
      change: null,
      changeLabel: 'all time',
      icon: Eye,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Messages',
      value: dashboardStats.messages.total_messages,
      change: dashboardStats.messages.messages_30d,
      changeLabel: 'this month',
      icon: MessageCircle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Active Buyers',
      value: dashboardStats.users.buyers,
      change: null,
      changeLabel: 'registered',
      icon: ShoppingBag,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
    {
      title: 'Active Sellers',
      value: dashboardStats.users.sellers,
      change: null,
      changeLabel: 'registered',
      icon: TrendingUp,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    },
    {
      title: 'Products Sold',
      value: dashboardStats.products.sold_products,
      change: null,
      changeLabel: 'all time',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'Platform Activity',
      value: dashboardStats.messages.messages_30d,
      change: null,
      changeLabel: 'messages this month',
      icon: Activity,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date Range Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive platform insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change ? metric.change > 0 : null;

          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {isPositive !== null && (
                      <>
                        {isPositive ? (
                          <ArrowUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                          {metric.change}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">{metric.changeLabel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown by user type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Buyers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{dashboardStats.users.buyers}</span>
                      <Badge variant="secondary">
                        {(
                          (dashboardStats.users.buyers / dashboardStats.users.total_users) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (dashboardStats.users.buyers / dashboardStats.users.total_users) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Sellers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{dashboardStats.users.sellers}</span>
                      <Badge variant="secondary">
                        {(
                          (dashboardStats.users.sellers / dashboardStats.users.total_users) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (dashboardStats.users.sellers / dashboardStats.users.total_users) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Landlords</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{dashboardStats.users.landlords}</span>
                      <Badge variant="secondary">
                        {(
                          (dashboardStats.users.landlords / dashboardStats.users.total_users) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (dashboardStats.users.landlords / dashboardStats.users.total_users) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                {platformStats?.dailyStats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Registrations</span>
                      <span className="text-2xl font-bold">
                        {platformStats.dailyStats.reduce((sum, day) => sum + day.registrations, 0)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {platformStats.dailyStats.slice(-7).map((day, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (day.registrations /
                                      Math.max(
                                        ...platformStats.dailyStats.map(d => d.registrations)
                                      )) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {day.registrations}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
                <CardDescription>Current product distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{dashboardStats.products.active_products}</span>
                      <Badge variant="default">
                        {(
                          (dashboardStats.products.active_products /
                            dashboardStats.products.total_products) *
                          100
                        ).toFixed(0)}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sold</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{dashboardStats.products.sold_products}</span>
                      <Badge variant="secondary">
                        {(
                          (dashboardStats.products.sold_products /
                            dashboardStats.products.total_products) *
                          100
                        ).toFixed(0)}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inactive</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{dashboardStats.products.inactive_products}</span>
                      <Badge variant="outline">
                        {(
                          (dashboardStats.products.inactive_products /
                            dashboardStats.products.total_products) *
                          100
                        ).toFixed(0)}
                        %
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Top categories by product count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.categories.slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{cat.category}</span>
                          <span className="text-sm text-muted-foreground">
                            {cat.product_count} products
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${
                                (cat.product_count /
                                  Math.max(
                                    ...dashboardStats.categories.map(c => c.product_count)
                                  )) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Message Activity</CardTitle>
                <CardDescription>Communication trends</CardDescription>
              </CardHeader>
              <CardContent>
                {platformStats?.messageActivity && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Messages</p>
                        <p className="text-2xl font-bold">
                          {platformStats.messageActivity.reduce(
                            (sum, day) => sum + day.messages,
                            0
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unread</p>
                        <p className="text-2xl font-bold">
                          {dashboardStats.messages.unread_messages}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      {platformStats.messageActivity.slice(-7).map((day, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (day.messages /
                                      Math.max(
                                        ...platformStats.messageActivity.map(d => d.messages)
                                      )) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{day.messages}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Views</CardTitle>
                <CardDescription>Engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-3xl font-bold">
                      {Number(dashboardStats.products.total_views).toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg. per Product</p>
                      <p className="text-xl font-bold">
                        {(
                          Number(dashboardStats.products.total_views) /
                          dashboardStats.products.total_products
                        ).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active Products</p>
                      <p className="text-xl font-bold">{dashboardStats.products.active_products}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Sellers</CardTitle>
              <CardDescription>Most active sellers on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {platformStats?.topSellers && (
                <div className="space-y-4">
                  {platformStats.topSellers.slice(0, 10).map((seller, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{seller.display_name || seller.email}</p>
                          <p className="text-xs text-muted-foreground">{seller.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{seller.product_count} products</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(seller.total_views).toLocaleString()} views
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
