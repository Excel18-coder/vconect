import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  Eye,
  ShoppingCart,
  Users,
  BarChart3,
  PieChart,
  CreditCard,
  Wallet,
  Receipt,
  Target
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  type: 'sale' | 'refund' | 'fee';
}

const Revenue = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    available: 0,
    growth: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch revenue data
  useEffect(() => {
    if (user) {
      fetchRevenueData();
    }
  }, [user, timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch revenue overview
      const overviewRes = await fetch(`${apiUrl}/revenue/overview?period=${timeRange.replace('days', '')}`, { headers });
      const overviewData = await overviewRes.json();

      if (overviewData.success) {
        const overview = overviewData.data.overview;
        setRevenueStats({
          total: overview.totalRevenue || 0,
          thisMonth: overview.monthlyRevenue || 0,
          lastMonth: Math.round(overview.monthlyRevenue * 0.9) || 0,
          pending: overview.pendingRevenue || 0,
          available: overview.availableRevenue || 0,
          growth: overview.conversionRate || 0
        });
        setCategoryRevenue(overviewData.data.categoryBreakdown || []);
        setTopProducts(overviewData.data.topProducts || []);
      }

      // Fetch transactions
      const transactionsRes = await fetch(`${apiUrl}/revenue/transactions?limit=10`, { headers });
      const transactionsData = await transactionsRes.json();

      if (transactionsData.success) {
        setTransactions(transactionsData.data.transactions || []);
      }

    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    toast.success('Withdrawal request initiated!');
  };

  const handleRequestPayout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${apiUrl}/revenue/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: revenueStats.available,
          paymentMethod: 'bank_account'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payout request submitted! Funds will be transferred within 24 hours.');
      } else {
        toast.error(data.message || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-8">You need to sign in to access revenue analytics.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Revenue & Earnings</h1>
                  <p className="text-muted-foreground">
                    Track your sales, earnings, and financial performance
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.info('Export functionality coming soon!')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading revenue data...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">KSh {revenueStats.total.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>+{revenueStats.growth}% from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">This Month</p>
                <div className="p-2 bg-blue-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">KSh {revenueStats.thisMonth.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                vs KSh {revenueStats.lastMonth.toLocaleString()} last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Pending</p>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Wallet className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">KSh {revenueStats.pending.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Being processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Available</p>
                <div className="p-2 bg-purple-100 rounded-full">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">KSh {revenueStats.available.toLocaleString()}</p>
              <Button size="sm" className="mt-2 w-full" variant="outline" onClick={handleWithdraw}>
                Withdraw
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue by Category */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                  <CardDescription>Your earnings breakdown across different categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryRevenue.map((cat, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cat.name}</span>
                            {cat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                            {cat.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                          </div>
                          <span className="font-bold">KSh {cat.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-600" 
                              style={{ width: `${cat.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">{cat.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key indicators for this period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Sales</span>
                    </div>
                    <span className="font-bold">47</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Product Views</span>
                    </div>
                    <span className="font-bold">2,341</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Conversion Rate</span>
                    </div>
                    <span className="font-bold">2.01%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Unique Buyers</span>
                    </div>
                    <span className="font-bold">38</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>All your sales, refunds, and fees</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Filter options will be available soon!')}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          txn.type === 'sale' ? 'bg-green-100' :
                          txn.type === 'refund' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {txn.type === 'sale' ? (
                            <ShoppingCart className="h-4 w-4 text-green-600" />
                          ) : txn.type === 'refund' ? (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          ) : (
                            <Receipt className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{txn.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">{txn.id}</p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.amount >= 0 ? '+' : ''}KSh {Math.abs(txn.amount).toLocaleString()}
                        </p>
                        <Badge variant="outline" className={getStatusColor(txn.status)}>
                          {txn.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue for the past 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[...Array(30)].map((_, i) => {
                      const height = Math.random() * 100;
                      return (
                        <div 
                          key={i}
                          className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t hover:opacity-75 transition-opacity cursor-pointer"
                          style={{ height: `${height}%` }}
                          title={`Day ${i + 1}: KSh ${Math.floor(height * 1000).toLocaleString()}`}
                        ></div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>Your best sellers this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'iPhone 14 Pro Max', sales: 12, revenue: 156000 },
                      { name: 'MacBook Air M2', sales: 8, revenue: 125000 },
                      { name: 'Samsung Galaxy S24', sales: 15, revenue: 98000 },
                      { name: 'iPad Pro 11"', sales: 6, revenue: 72000 },
                      { name: 'AirPods Pro', sales: 23, revenue: 45000 }
                    ].map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                          </div>
                        </div>
                        <p className="font-bold text-sm">KSh {product.revenue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
                <CardDescription>Manage how you receive your earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Default Payment Method</h4>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Bank Account</p>
                        <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast.info('Edit payment method')}>Edit</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-3">Payout Schedule</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="font-medium">Weekly (Every Monday)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Minimum amount:</span>
                        <span className="font-medium">KSh 5,000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next payout:</span>
                        <span className="font-medium text-green-600">October 28, 2025</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleRequestPayout}>Request Instant Payout</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Revenue;
