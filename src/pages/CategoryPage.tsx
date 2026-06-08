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
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <Navigation />
        <div className="container mx-auto px-4 py-16 sm:py-20 pb-24 sm:pb-32">
          <div className="mb-12 sm:mb-16 text-center space-y-5 sm:space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-sm group mb-6 sm:mb-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <ArrowLeft className="h-3 w-3 mr-3 group-hover:-translate-x-1 transition-transform" />
              Return to Catalog
            </Button>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase text-primary dark:text-white leading-none">
              Strategic <span className="text-accent underline underline-offset-8 decoration-8 decoration-accent/20">Transport</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              High-velocity logistics and enterprise-grade seat allocation for the Kenyan transport corridor.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-8 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
            <MatatuHub userId={user?.id} />
          </div>
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-20 pb-40">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 sm:gap-12 pb-10 sm:pb-12 border-b-2 border-slate-50 dark:border-slate-900">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-accent font-black uppercase tracking-[0.3em] text-[10px]">
                <Sparkles className="h-4 w-4" />
                Verified Sector Inventory
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black italic tracking-tighter text-primary dark:text-white uppercase leading-none">
                {categoryTitles[category || ""] || "Specialty Assets"}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-slate-500 max-w-2xl font-medium">
                {categoryDescriptions[category || ""] || "Access our highly curated portfolio of premium marketplace assets."}
              </p>
            </div>

            <div className="flex flex-col gap-4 min-w-0 md:min-w-[350px] w-full md:w-auto">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter strategic inventory..."
                  className="h-12 sm:h-14 pl-12 rounded-sm border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 focus:ring-0 transition-all font-bold uppercase text-[9px] sm:text-[10px] tracking-widest"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-accent rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Current Yield: <span className="text-primary dark:text-white">{filteredProducts.length} Assets Found</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-sm border border-slate-100 dark:border-slate-800">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-sm h-8 px-4 font-black uppercase tracking-widest text-[9px] ${viewMode === "grid" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "hover:bg-white/50"}`}
              >
                <Grid className="h-3 w-3 mr-2" />
                Grid view
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`rounded-sm h-8 px-4 font-black uppercase tracking-widest text-[9px] ${viewMode === "list" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "hover:bg-white/50"}`}
              >
                <List className="h-3 w-3 mr-2" />
                List view
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-8">
              <div className="h-16 w-16 border-4 border-slate-100 border-t-accent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Sector Data...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800">
              <Package className="h-20 w-20 text-slate-200 mb-8" />
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-primary dark:text-white">Zero Convergence</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 mb-10">No assets matching your sector parameters.</p>
              <Button variant="outline" onClick={() => navigate("/")} className="h-12 px-10 rounded-sm border-2 font-black uppercase tracking-widest text-[10px]">
                Reset Navigation
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1" : "space-y-6"}>
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
        <DialogContent className="max-w-md rounded-sm p-0 overflow-hidden border-0 shadow-premium">
          <DialogHeader className="p-8 bg-slate-950 text-white">
            <div className="flex items-center gap-3 text-accent font-black uppercase tracking-[0.3em] text-[8px] mb-2">
              <MessageCircle className="h-3 w-3" />
              Secure Inquiry Protocol
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Initiate Inquiry</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Asset: <span className="text-white">{selectedProduct?.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Message</Label>
                <Textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Formulate your inquiry to the asset manager..."
                  className="rounded-sm bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-medium text-sm focus:border-primary/20 transition-all p-4"
                  rows={5}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowContactDialog(false)} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageForm.message}
              className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] px-8 h-11 rounded-sm shadow-sm"
            >
              {sendingMessage ? "Processing..." : "Transmit Inquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default CategoryPage;
