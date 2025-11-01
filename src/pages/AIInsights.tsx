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
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  Eye,
  MessageSquare
} from "lucide-react";

interface Insight {
  id: number;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'trend' | 'recommendation';
  impact: 'high' | 'medium' | 'low';
  category: string;
}

interface MarketTrend {
  category: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  volume: number;
}

const AIInsights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [marketScore, setMarketScore] = useState(0);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    trendingCategories: 0,
    predictionAccuracy: 92
  });

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch real data from API
  useEffect(() => {
    fetchMarketInsights();
  }, []);

  const fetchMarketInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/analytics/insights`, { headers });
      const data = await response.json();

      if (data.success) {
        setInsights(data.data.insights || []);
        setMarketTrends(data.data.marketTrends || []);
        setMarketScore(data.data.marketScore || 0);
        setStats({
          totalOpportunities: data.data.totalOpportunities || 0,
          trendingCategories: data.data.trendingCategories || 0,
          predictionAccuracy: 92
        });
      }
    } catch (error) {
      console.error('Error fetching market insights:', error);
      toast.error('Failed to load market insights');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Zap className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-purple-500" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Insights & Analytics</h1>
              <p className="text-muted-foreground">
                Powered by machine learning to help you make smarter decisions
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading market insights...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Market Score</p>
                  <p className="text-3xl font-bold">{marketScore}/100</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <ArrowUp className="h-3 w-3" />
                    {marketScore > 50 ? 'Strong market' : 'Growing market'}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Opportunities</p>
                  <p className="text-3xl font-bold">{stats.totalOpportunities}</p>
                  <p className="text-xs text-blue-600">{insights.filter(i => i.impact === 'high').length} high priority</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trending Now</p>
                  <p className="text-3xl font-bold">{stats.trendingCategories}</p>
                  <p className="text-xs text-purple-600">Categories surging</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Predictions</p>
                  <p className="text-3xl font-bold">{stats.predictionAccuracy}%</p>
                  <p className="text-xs text-orange-600">Accuracy rate</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <Brain className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Insights for You</CardTitle>
                  <CardDescription>AI-generated recommendations based on your activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <Badge variant="outline" className={getImpactColor(insight.impact)}>
                            {insight.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('insights')}>
                    View All Insights
                  </Button>
                </CardContent>
              </Card>

              {/* Market Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Health</CardTitle>
                  <CardDescription>Real-time market performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Activity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '87%' }}></div>
                        </div>
                        <span className="text-sm font-semibold">87%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Buyer Confidence</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: '76%' }}></div>
                        </div>
                        <span className="text-sm font-semibold">76%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Seller Competition</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: '65%' }}></div>
                        </div>
                        <span className="text-sm font-semibold">65%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Price Stability</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-sm font-semibold">92%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge variant="outline" className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="secondary">{insight.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => toast.info(`Taking action on: ${insight.title}`)}>Take Action</Button>
                          <Button size="sm" variant="outline" onClick={() => toast.info(`More information about: ${insight.title}`)}>Learn More</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Market Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Real-time market trends across all categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          trend.trend === 'up' ? 'bg-green-100' : 
                          trend.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {trend.trend === 'up' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : trend.trend === 'down' ? (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          ) : (
                            <Activity className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{trend.category}</h4>
                          <p className="text-sm text-muted-foreground">{trend.volume.toLocaleString()} active listings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          trend.trend === 'up' ? 'text-green-600' : 
                          trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
                        </p>
                        <p className="text-xs text-muted-foreground">vs last week</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Price Predictions</CardTitle>
                  <CardDescription>AI-powered price forecasts for next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowUp className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-800">Electronics</span>
                      </div>
                      <p className="text-sm text-green-700">Expected to increase by 15-20% in the next 2 weeks</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">Real Estate</span>
                      </div>
                      <p className="text-sm text-blue-700">Stable pricing expected, good time to list</p>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowDown className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-red-800">Fashion</span>
                      </div>
                      <p className="text-sm text-red-700">May decrease by 8-12% due to seasonal changes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Demand Forecast</CardTitle>
                  <CardDescription>Predicted buyer interest for various categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Back to School (Education)</span>
                        <span className="text-sm font-bold text-purple-600">Peak: Jan 10-20</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Holiday Season</span>
                        <span className="text-sm font-bold text-green-600">Peak: Dec 15-25</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Summer Sales</span>
                        <span className="text-sm font-bold text-orange-600">Peak: Jun 1-15</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-full shadow-sm">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Unlock Premium AI Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized insights, advanced predictions, and automated recommendations
                  </p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600" onClick={() => toast.success('Premium features coming soon! Stay tuned.')}>
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AIInsights;
