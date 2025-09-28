import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Search as SearchIcon,
  Heart,
  Share2,
  Clock
} from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);

  // Mock search results
  const results = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    title: `Search Result ${i + 1} for "${searchQuery}"`,
    price: Math.floor(Math.random() * 100000) + 5000,
    location: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'][Math.floor(Math.random() * 4)],
    rating: 4 + Math.random(),
    reviews: Math.floor(Math.random() * 100) + 10,
    category: ['House', 'Transport', 'Market', 'Health', 'Jobs'][Math.floor(Math.random() * 5)],
    featured: Math.random() > 0.7,
    seller: `Seller ${i + 1}`,
    description: `High quality item matching your search for "${searchQuery}". Great condition and competitive pricing.`,
    timePosted: Math.floor(Math.random() * 24) + 1
  }));

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      // Simulate search loading
      setLoading(true);
      setTimeout(() => setLoading(false), 1000);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative max-w-2xl">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search products, services, properties..."
                className="pl-12 pr-4 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-pink-500"
              >
                Search
              </Button>
            </div>
          </form>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {searchQuery ? `Search results for "${searchQuery}"` : 'Search Results'}
              </h1>
              <p className="text-muted-foreground">
                {searchQuery ? `Found ${results.length} results` : 'Enter a search term to find items'}
              </p>
            </div>
          </div>
        </div>

        {searchQuery && (
          <>
            {/* Filters */}
            <div className="mb-8 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">All Categories</Badge>
                  <Badge variant="outline">House</Badge>
                  <Badge variant="outline">Transport</Badge>
                  <Badge variant="outline">Market</Badge>
                  <Badge variant="outline">Health</Badge>
                  <Badge variant="outline">Jobs</Badge>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Select defaultValue="relevance">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((item) => (
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
                        <span className="text-muted-foreground text-center px-4">
                          {item.title}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.timePosted}h ago</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
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
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-primary">
                          KSh {item.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {item.seller}
                        </div>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-primary to-pink-500">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Results
              </Button>
            </div>
          </>
        )}

        {!searchQuery && (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Start Your Search</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Enter keywords above to find products, services, properties, jobs and more across Kenya
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {['Houses in Nairobi', 'Used Cars', 'Electronics', 'Remote Jobs'].map((suggestion) => (
                <Button 
                  key={suggestion}
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery(suggestion);
                    window.location.href = `/search?q=${encodeURIComponent(suggestion)}`;
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Search;