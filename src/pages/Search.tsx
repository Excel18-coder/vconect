import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productsAPI } from "@/services/api";
import {
  Heart,
  MapPin,
  Package,
  Search as SearchIcon,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch search results
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      fetchSearchResults(query);
    } else {
      setResults([]);
    }
  }, [searchParams, selectedCategory, sortBy]);

  const fetchSearchResults = async (query) => {
    try {
      setLoading(true);

      const filters: any = {
        search: query,
        sortBy: sortBy,
        limit: 50,
      };

      if (selectedCategory !== "all") {
        filters.category = selectedCategory;
      }

      const response = await productsAPI.searchProducts(query, filters);
      setResults(response.data?.products || []);
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (searchQuery) {
      fetchSearchResults(searchQuery);
    }
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    if (searchQuery) {
      fetchSearchResults(searchQuery);
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
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-pink-500">
                Search
              </Button>
            </div>
          </form>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {searchQuery
                  ? `Search results for "${searchQuery}"`
                  : "Search Results"}
              </h1>
              <p className="text-muted-foreground">
                {searchQuery
                  ? `Found ${results.length} results`
                  : "Enter a search term to find items"}
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
                  <Badge
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleCategoryChange("all")}>
                    All Categories
                  </Badge>
                  <Badge
                    variant={
                      selectedCategory === "house" ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryChange("house")}>
                    House
                  </Badge>
                  <Badge
                    variant={
                      selectedCategory === "transport" ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryChange("transport")}>
                    Transport
                  </Badge>
                  <Badge
                    variant={
                      selectedCategory === "market" ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryChange("market")}>
                    Market
                  </Badge>
                  <Badge
                    variant={
                      selectedCategory === "education" ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryChange("education")}>
                    Education
                  </Badge>
                  <Badge
                    variant={
                      selectedCategory === "entertainment"
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryChange("entertainment")}>
                    Entertainment
                  </Badge>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price-low">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price-high">
                        Price: High to Low
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results */}
            {results.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or browse our categories
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.map((item) => (
                    <Card
                      key={item.id}
                      className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/product/${item.id}`)}>
                      <div className="relative">
                        <div className="absolute top-2 right-2 z-10 flex gap-1">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}>
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.condition && (
                            <Badge variant="secondary" className="text-xs">
                              {item.condition}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </CardTitle>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{item.location || "Kenya"}</span>
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
                              by {item.seller_name || "Seller"}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-primary to-pink-500">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Results count */}
                <div className="text-center mt-12">
                  <p className="text-sm text-muted-foreground">
                    Showing {results.length}{" "}
                    {results.length === 1 ? "result" : "results"} for "
                    {searchQuery}"
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {!searchQuery && (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Start Your Search</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Enter keywords above to find products, services, properties and
              more across Kenya
            </p>
            <Button
              onClick={() => navigate("/category/market")}
              className="bg-gradient-to-r from-primary to-pink-500">
              Browse All Categories
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Search;
