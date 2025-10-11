import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  DollarSign, 
  Users,
  BarChart3,
  Package,
  ArrowRight,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  location: string;
  images: string[];
  status: string;
  views: number;
  created_at: string;
  category: string;
}

const Sell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalRevenue: 0,
    totalViews: 0,
    conversionRate: 0
  });

  // Fetch seller's products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:5000/api/products/seller/my-products', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data.data.products || []);
          
          // Calculate stats from products
          const active = data.data.products.filter((p: Product) => p.status === 'active').length;
          const totalViews = data.data.products.reduce((sum: number, p: Product) => sum + (p.views || 0), 0);
          
          setStats({
            activeListings: active,
            totalRevenue: 0, // We'll calculate this when orders are implemented
            totalViews: totalViews,
            conversionRate: 0
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  const deleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from local state
        setProducts(products.filter(p => p.id !== productId));
        alert('Product deleted successfully!');
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-8">You need to sign in to start selling.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const statsDisplay = [
    { label: "Active Listings", value: stats.activeListings.toString(), change: "+3 this month" },
    { label: "Total Revenue", value: `KSh ${stats.totalRevenue.toLocaleString()}`, change: "+15% this month" },
    { label: "Total Views", value: stats.totalViews.toLocaleString(), change: "+8% this month" },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, change: "+0.5% this month" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your listings and track your performance
              </p>
            </div>
            <Button 
              onClick={() => navigate('/post-ad')}
              className="bg-gradient-to-r from-primary to-pink-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Post New Ad
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.change}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Get started with your selling journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex-col items-start"
                    onClick={() => navigate('/post-ad')}
                  >
                    <Plus className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <div className="font-semibold">Post New Ad</div>
                      <div className="text-sm text-muted-foreground">Create a new listing</div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex-col items-start"
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <div className="font-semibold">View Analytics</div>
                      <div className="text-sm text-muted-foreground">Track performance</div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex-col items-start"
                  >
                    <Package className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <div className="font-semibold">Manage Inventory</div>
                      <div className="text-sm text-muted-foreground">Update stock levels</div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex-col items-start"
                  >
                    <DollarSign className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <div className="font-semibold">Payment Settings</div>
                      <div className="text-sm text-muted-foreground">Configure payments</div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* My Products */}
            <Card>
              <CardHeader>
                <CardTitle>My Products</CardTitle>
                <CardDescription>
                  {loading ? 'Loading your products...' : `${products.length} products found`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading your products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No products yet</p>
                    <Button onClick={() => navigate('/post-ad')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Post Your First Ad
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-start justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex gap-4 flex-1">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="font-bold text-primary">
                                KSh {product.price.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Eye className="h-3 w-3" />
                                {product.views || 0} views
                              </span>
                              <span className="text-muted-foreground">
                                {product.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                            className={product.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {product.status}
                          </Badge>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => navigate(`/edit-product/${product.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seller Tips */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Seller Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">High-Quality Photos</h4>
                  <p className="text-xs text-muted-foreground">
                    Listings with 5+ photos get 3x more views
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Detailed Descriptions</h4>
                  <p className="text-xs text-muted-foreground">
                    Include key features and specifications
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Competitive Pricing</h4>
                  <p className="text-xs text-muted-foreground">
                    Research similar items for optimal pricing
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Quick Responses</h4>
                  <p className="text-xs text-muted-foreground">
                    Reply to inquiries within 24 hours
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Revenue</span>
                    <span>KSh 45,600 / KSh 50,000</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '91%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Listings</span>
                    <span>12 / 15</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Sell;