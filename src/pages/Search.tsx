import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productsAPI, messageAPI } from "@/services/api-client";
import {
  Package,
  Search as SearchIcon,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth-optimized";
import ProductCard from "@/components/marketplace/ProductCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
  tags: string[];
  condition?: string;
  views: number;
  seller?: {
    id: string;
    display_name: string;
    phone_number?: string;
  };
  seller_name?: string;
  createdAt?: string;
  created_at?: string;
}

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: "", message: "" });

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

  const fetchSearchResults = async (query: string) => {
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

  const handleContactSeller = (product: Product) => {
    if (!user) {
      toast.error("Please sign in to contact seller");
      navigate("/auth");
      return;
    }
    setSelectedProduct(product);
    setMessageForm({
      subject: `Inquiry about: ${product.title}`,
      message: "",
    });
    setShowContactDialog(true);
  };

  const handleSendMessage = async () => {
    if (!messageForm.subject || !messageForm.message || !selectedProduct?.seller?.id) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      setSendingMessage(true);
      await messageAPI.sendMessage(selectedProduct.seller.id, messageForm.subject, messageForm.message);
      toast.success("Message sent successfully!");
      setShowContactDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const addToFavorites = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    try {
      await productAPI.favorite(productId);
      toast.success("Added to favorites");
    } catch (error) {
      toast.error("Failed to add to favorites");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Search Header */}
          <div className="relative p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <SearchIcon className="h-64 w-64 rotate-12" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs">
                  <Sparkles className="h-4 w-4" />
                  Global Search
                </div>
                <h1 className="text-4xl lg:text-5xl font-black italic tracking-tight">
                  {searchQuery ? `Search results for "${searchQuery}"` : "Discover the Entire Marketplace"}
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Find exactly what you're looking for among thousands of verified listings across Kenya.
                </p>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    placeholder="What are you looking for today?"
                    className="h-16 pl-14 pr-6 text-lg rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg shadow-blue-600/20"
                >
                  Execute Search
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>

          {searchQuery && (
            <div className="space-y-8">
              {/* Filters Bar */}
              <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 items-center justify-between">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
                  <Badge
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    className={`cursor-pointer h-10 px-6 rounded-xl transition-all ${selectedCategory === "all" ? "bg-blue-600 shadow-md shadow-blue-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200"}`}
                    onClick={() => setSelectedCategory("all")}>
                    All Categories
                  </Badge>
                  {["housing", "market", "entertainment"].map((cat) => (
                    <Badge
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      className={`cursor-pointer h-10 px-6 rounded-xl capitalize transition-all ${selectedCategory === cat ? "bg-blue-600 shadow-md shadow-blue-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200"}`}
                      onClick={() => setSelectedCategory(cat)}>
                      {cat}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 w-full lg:w-[200px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Sort Results" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Count Info */}
              {!loading && results.length > 0 && (
                <div className="px-4">
                  <h3 className="text-xl font-bold">
                    Found <span className="text-blue-600">{results.length}</span> results for your query
                  </h3>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-4 animate-pulse">
                      <div className="aspect-[4/5] bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Package className="h-20 w-20 text-muted-foreground opacity-20 mb-6" />
                  <h2 className="text-3xl font-black italic">No matches found</h2>
                  <p className="text-muted-foreground text-lg mt-2 mb-8">Try adjusting your terms or browse categories.</p>
                  <Button variant="outline" onClick={() => navigate("/")} className="h-12 px-8 rounded-xl font-bold">
                    Return to Directory
                  </Button>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-6"}>
                  {results.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                      user={user}
                      onContactSeller={handleContactSeller}
                      onAddToFavorites={addToFavorites}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!searchQuery && (
            <div className="flex flex-col items-center justify-center py-32 space-y-8">
              <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <SearchIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-3xl font-black italic tracking-tight">Ready to Find Something?</h2>
                <p className="text-muted-foreground text-lg">
                  Enter keywords above to start exploring products, houses, and services across Kenya.
                </p>
              </div>
              <Button
                onClick={() => navigate("/")}
                className="h-14 px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform"
              >
                Explore Categories
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Contact Seller Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-2xl font-black italic">Contact Seller</DialogTitle>
            <DialogDescription className="text-base">
              Item: <span className="font-bold text-blue-600">"{selectedProduct?.title}"</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message Body</Label>
                <Textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell the seller what you're looking for..."
                  className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 italic"
                  rows={6}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowContactDialog(false)} className="font-bold rounded-xl">Cancel</Button>
            <Button onClick={handleSendMessage} disabled={sendingMessage || !messageForm.message} className="bg-blue-600 hover:bg-blue-700 font-bold px-8 rounded-xl h-11">
              {sendingMessage ? "Sending..." : "Submit Inquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Search;
