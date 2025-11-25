import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { messageAPI } from "@/services/api";
import {
  DollarSign,
  Eye,
  Grid3X3,
  Heart,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const getWhatsAppUrl = (phone: string | undefined, text: string) => {
    if (!phone) return null;
    let digits = phone.replace(/\D/g, "");
    if (!digits) return null;

    if (/^0+/.test(digits)) {
      digits = "254" + digits.replace(/^0+/, "");
    }

    if (digits.length < 8) return null;
    const encoded = encodeURIComponent(
      text || "Hello, I am interested in your listing"
    );
    return `https://wa.me/${digits}?text=${encoded}`;
  };

  const categories = [
    { value: "house", label: "Real Estate" },
    { value: "transport", label: "Transportation" },
    { value: "market", label: "Marketplace" },
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
  ];

  const locations = ["nairobi", "mombasa", "kisumu", "nakuru", "eldoret"];

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
        `${apiUrl}/products/browse?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        // API returns data in data.data.products structure
        setProducts(data.data?.products || data.products || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
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
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${apiUrl}/products/${productId}/favorite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Added to favorites");
      } else {
        toast.error("Failed to add to favorites");
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
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
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                placeholder="Min Price"
                type="number"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
              />
              <Input
                placeholder="Max Price"
                type="number"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {products.length} Product{products.length !== 1 ? "s" : ""} Found
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search criteria or browse all categories
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
          {products.map((product) => (
            <Card
              key={product.id}
              className={viewMode === "list" ? "overflow-hidden" : ""}>
              <div className={viewMode === "list" ? "flex" : ""}>
                {product.images && product.images.length > 0 && (
                  <div
                    className={
                      viewMode === "list"
                        ? "w-48 flex-shrink-0"
                        : "aspect-video"
                    }>
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={viewMode === "list" ? "flex-1" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {product.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3" />
                          {product.location?.charAt(0).toUpperCase() +
                            product.location?.slice(1)}
                          <span>•</span>
                          <span>{product.category}</span>
                        </CardDescription>
                      </div>
                      {user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addToFavorites(String(product.id))}>
                          <Heart className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-lg font-bold text-primary">
                        <DollarSign className="h-4 w-4" />
                        KSh {product.price.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {product.views}
                      </div>
                    </div>

                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {product.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        By{" "}
                        {product.seller?.display_name ||
                          product.seller_name ||
                          "Seller"}
                      </span>
                      <span>
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString()
                          : product.created_at
                          ? new Date(product.created_at).toLocaleDateString()
                          : ""}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleContactSeller(product)}>
                        Contact Seller
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/product/${product.id}`)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Seller Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
            <DialogDescription>
              Send a message to{" "}
              {selectedProduct?.seller?.display_name ||
                selectedProduct?.seller_name ||
                "the seller"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seller Contact Info */}
            {(selectedProduct?.seller?.email ||
              selectedProduct?.seller?.phone_number) && (
              <>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  {selectedProduct?.seller?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${selectedProduct.seller.email}`}
                        className="text-sm hover:underline">
                        {selectedProduct.seller.email}
                      </a>
                    </div>
                  )}
                  {selectedProduct?.seller?.phone_number && (
                    <>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${selectedProduct.seller.phone_number}`}
                          className="text-sm hover:underline">
                          {selectedProduct.seller.phone_number}
                        </a>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                        onClick={() => {
                          const phone =
                            selectedProduct.seller.phone_number?.replace(
                              /\D/g,
                              ""
                            );
                          const message = encodeURIComponent(
                            `Hi ${
                              selectedProduct.seller.display_name || "seller"
                            }, I'm interested in your product: ${
                              selectedProduct.title
                            }`
                          );
                          window.open(
                            `https://wa.me/${phone}?text=${message}`,
                            "_blank"
                          );
                        }}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact via WhatsApp
                      </Button>
                    </>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Message Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={messageForm.subject}
                  onChange={(e) =>
                    setMessageForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={messageForm.message}
                  onChange={(e) =>
                    setMessageForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Write your message here..."
                  rows={5}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowContactDialog(false)}
              disabled={sendingMessage}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={
                sendingMessage || !messageForm.subject || !messageForm.message
              }>
              {sendingMessage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
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
