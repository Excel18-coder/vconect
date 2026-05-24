import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth-optimized";
import { messageAPI } from "@/services/api-client";
import { API_CONFIG } from "@/config/api";
import { productAPI } from "@/services/api-client";
import {
  Mail,
  MessageCircle,
  Package,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ProductCard from "./marketplace/ProductCard";
import ProductFilters from "./marketplace/ProductFilters";

interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  condition: string;
  location: string;
  images: string[];
  tags: string[];
  status: "active" | "sold" | "inactive";
  views: number;
  seller?: {
    id: string;
    display_name: string;
    email: string;
    location: string;
    phone_number?: string;
  };
  seller_name?: string;
  seller_email?: string;
  seller_location?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

const ProductBrowser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: "",
  });

  const apiUrl = API_CONFIG.BASE_URL;

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedLocation, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedLocation && selectedLocation !== "all")
        params.append("location", selectedLocation);
      if (priceRange.min) params.append("minPrice", priceRange.min);
      if (priceRange.max) params.append("maxPrice", priceRange.max);
      if (searchTerm) params.append("search", searchTerm);
      params.append("sortBy", sortBy);

      const response = await fetch(
        `${apiUrl}/products/browse?${params.toString()}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data?.products || data.products || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts();
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLocation("all");
    setPriceRange({ min: "", max: "" });
    setSortBy("newest");
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
    if (!messageForm.subject || !messageForm.message) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!selectedProduct?.seller?.id) {
      toast.error("Seller information not available");
      return;
    }

    try {
      setSendingMessage(true);
      await messageAPI.sendMessage(
        selectedProduct.seller.id,
        messageForm.subject,
        messageForm.message
      );

      toast.success("Message sent successfully!");
      setShowContactDialog(false);
      setSelectedProduct(null);
      setMessageForm({ subject: "", message: "" });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Search and Filters */}
      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onSearch={handleSearch}
        onClear={clearFilters}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 italic">
            {loading ? "Searching..." : `${products.length} Items Found`}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Browse through the latest high-quality listings in Kenya
          </p>
        </div>
      </div>

      {/* Results List/Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-pulse">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-600 font-bold uppercase tracking-widest text-xs">Fetching Marketplace Data</p>
        </div>
      ) : products.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-full mb-6">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No matches found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              We couldn't find any products matching your current filters. Try
              expanding your search or clearing filters.
            </p>
            <Button onClick={clearFilters} variant="outline" className="mt-8 rounded-xl font-bold">
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              : "space-y-6"
          }>
          {products.map((product) => (
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

      {/* Contact Seller Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-2xl font-black italic">Contact Seller</DialogTitle>
            <DialogDescription className="text-base">
              You are inquiring about: <span className="font-bold text-blue-600">"{selectedProduct?.title}"</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            {/* Quick Contact Options */}
            <div className="grid grid-cols-2 gap-4">
              {selectedProduct?.seller?.phone_number && (
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-900 group transition-all"
                  onClick={() => {
                    const phone = selectedProduct.seller?.phone_number?.replace(/\D/g, "");
                    const message = encodeURIComponent(`Hi, I'm interested in: ${selectedProduct.title}`);
                    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                  }}
                >
                  <MessageCircle className="h-6 w-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">WhatsApp</span>
                </Button>
              )}
              {selectedProduct?.seller?.phone_number && (
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-900 group transition-all"
                  asChild
                >
                  <a href={`tel:${selectedProduct.seller.phone_number}`}>
                    <Phone className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Call Now</span>
                  </a>
                </Button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground">
                <span className="bg-white dark:bg-slate-950 px-4">Or Send Message</span>
              </div>
            </div>

            {/* Message Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Subject</Label>
                <Input
                  id="subject"
                  value={messageForm.subject}
                  onChange={(e) =>
                    setMessageForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Message</Label>
                <Textarea
                  id="message"
                  value={messageForm.message}
                  onChange={(e) =>
                    setMessageForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Ask about availability, price, or location..."
                  rows={4}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setShowContactDialog(false)}
              disabled={sendingMessage}
              className="font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={
                sendingMessage || !messageForm.subject || !messageForm.message
              }
              className="bg-blue-600 hover:bg-blue-700 font-bold px-8 rounded-xl h-11"
            >
              {sendingMessage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Inquire Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductBrowser;
