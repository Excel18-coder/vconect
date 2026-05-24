import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import MatatuHub from "@/components/matatu/MatatuHub";
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
import {
  Filter,
  Grid,
  List,
  Package,
  Search,
  Sparkles,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth-optimized";
import ProductCard from "@/components/marketplace/ProductCard";
import { toast } from "sonner";
import { productAPI } from "@/services/api-client";
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
import { messageAPI } from "@/services/api-client";

interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
  tags: string[];
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

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: "", message: "" });

  const categoryTitles: { [key: string]: string } = {
    housing: "Premium Real Estate",
    transport: "Matatu Bookings",
    market: "Trusted Marketplace",
    entertainment: "Events & Media",
  };

  const categoryDescriptions: { [key: string]: string } = {
    housing: "Discover exclusive properties and residential spaces across Kenya.",
    transport: "Reliable and fast matatu seat bookings for your next journey.",
    market: "The best deals on high-quality electronics, furniture, and more.",
    entertainment: "Access top-tier event equipment and entertainment services.",
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { productsAPI } = await import("@/services/api-client");
        const filters: any = { limit: 50 };
        if (category) filters.category = category;
        const response = await productsAPI.browseProducts(filters);
        setProducts(response.data?.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    if (category !== "transport") fetchProducts();
  }, [category]);

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

  if (category === "transport") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="mb-10 text-center space-y-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-xl group mb-4">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Marketplace
            </Button>
            <h1 className="text-4xl font-black italic tracking-tight">{categoryTitles.transport}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {categoryDescriptions.transport}
            </p>
          </div>
          <MatatuHub userId={user?.id} />
        </div>
        <Footer />
      </div>
    );
  }

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-8 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs">
                <Sparkles className="h-4 w-4" />
                Curated Collection
              </div>
              <h1 className="text-4xl lg:text-5xl font-black italic tracking-tight">
                {categoryTitles[category || ""] || "Specialty Listings"}
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">
                {categoryDescriptions[category || ""] || "Discover high-quality options tailored for your needs."}
              </p>
            </div>

            <div className="flex flex-col gap-4 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search within category..."
                  className="h-12 pl-11 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-lg h-7 px-3 bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                {filteredProducts.length} Items Found
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-xl h-9 px-4 ${viewMode === "grid" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "hover:bg-transparent"}`}
              >
                <Grid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`rounded-xl h-9 px-4 ${viewMode === "list" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "hover:bg-transparent"}`}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Syncing Listings</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-[2rem]">
              <CardContent className="flex flex-col items-center justify-center py-24 italic">
                <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-2xl font-bold">No results found</h3>
                <p className="text-muted-foreground mt-2">Try refining your search or explore other categories.</p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-6"}>
              {filteredProducts.map((product) => (
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

export default CategoryPage;
