import { useState } from "react";
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
  TrendingUp
} from "lucide-react";

const Sell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const stats = [
    { label: "Active Listings", value: "12", change: "+3 this month" },
    { label: "Total Revenue", value: "KSh 45,600", change: "+15% this month" },
    { label: "Total Views", value: "1,234", change: "+8% this month" },
    { label: "Conversion Rate", value: "3.2%", change: "+0.5% this month" }
  ];

  const recentListings = [
    { title: "Modern Apartment in Westlands", views: 89, inquiries: 5, status: "Active" },
    { title: "Toyota Corolla 2019", views: 156, inquiries: 12, status: "Sold" },
    { title: "MacBook Pro 2021", views: 67, inquiries: 3, status: "Active" }
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
          {stats.map((stat, index) => (
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

            {/* Recent Listings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Listings</CardTitle>
                <CardDescription>
                  Your latest posted ads and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentListings.map((listing, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{listing.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {listing.views} views • {listing.inquiries} inquiries
                        </p>
                      </div>
                      <Badge 
                        variant={listing.status === 'Sold' ? 'default' : 'secondary'}
                        className={listing.status === 'Sold' ? 'bg-green-500' : ''}
                      >
                        {listing.status}
                      </Badge>
                    </div>
                  ))}
                </div>
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