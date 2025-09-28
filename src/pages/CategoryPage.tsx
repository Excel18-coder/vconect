import { useParams } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Filter, 
  MapPin, 
  Star, 
  Search,
  Grid,
  List,
  Heart,
  Share2
} from "lucide-react";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with real data fetching
  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Sample ${category} Item ${i + 1}`,
    price: Math.floor(Math.random() * 100000) + 5000,
    location: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'][Math.floor(Math.random() * 4)],
    rating: 4 + Math.random(),
    reviews: Math.floor(Math.random() * 100) + 10,
    image: `https://images.unsplash.com/photo-${1500000000000 + i}?w=300&h=200&fit=crop`,
    featured: Math.random() > 0.7,
    seller: `Seller ${i + 1}`,
    description: `High quality ${category} item with excellent features and competitive pricing.`
  }));

  const categoryTitles: { [key: string]: string } = {
    house: "Real Estate & Properties",
    transport: "Transportation & Logistics", 
    market: "Marketplace & Shopping",
    health: "Healthcare Services",
    jobs: "Jobs & Careers",
    education: "Education & Courses",
    entertainment: "Entertainment & Media",
    revenue: "Revenue & Analytics",
    "ai-insights": "AI Insights & Analytics"
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {categoryTitles[category || ''] || 'Category'}
          </h1>
          <p className="text-muted-foreground">
            Discover the best {category} options in Kenya
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={`Search ${category}...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="nairobi">Nairobi</SelectItem>
                  <SelectItem value="mombasa">Mombasa</SelectItem>
                  <SelectItem value="kisumu">Kisumu</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary">Featured</Badge>
              <Badge variant="outline">New</Badge>
              <Badge variant="outline">Premium</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {items.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
              <div className="relative">
                {item.featured && (
                  <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-primary to-pink-500">
                    Featured
                  </Badge>
                )}
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                    <span className="text-muted-foreground">{item.title}</span>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{item.rating.toFixed(1)}</span>
                    <span>({item.reviews})</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      KSh {item.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {item.seller}
                    </div>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-primary to-pink-500">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Results
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CategoryPage;