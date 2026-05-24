import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth-optimized';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { messageAPI, productAPI } from '@/services/api-client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Tag,
  Package,
  Truck,
  Shield,
  Mail,
  Phone,
  MessageCircle,
  Eye,
  Star,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface Product {
  id: number;
  user_id?: string;
  title: string;
  description: string;
  price: number;
  category?: string;
  category_name?: string;
  category_slug?: string;
  subcategory?: string;
  condition: string;
  location: string;
  stock_quantity?: number;
  discount_percentage?: number;
  weight?: number;
  shipping_cost?: number;
  views?: number;
  views_count?: number;
  status: string;
  tags?: string[];
  images: Array<{ url: string } | string>;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  warranty_period?: string;
  warranty_type?: string;
  return_policy?: string;
  negotiable?: boolean;
  contact_phone?: string;
  contactPhone?: string;
  seller_id?: string;
  seller: {
    id?: number | string;
    user_id?: string;
    display_name?: string;
    name?: string;
    seller_name?: string;
    email: string;
    seller_email?: string;
    phone?: string;
    phone_number?: string;
    seller_phone?: string;
    avatar?: string;
    avatar_url?: string;
    seller_avatar?: string;
    location?: string;
    seller_location?: string;
  };
  created_at: string;
  final_price?: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
  });

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      setMessageForm(prev => ({
        ...prev,
        subject: `Inquiry about: ${product.title}`,
      }));
    }
  }, [product]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user || !product?.id) {
        setIsFavorite(false);
        return;
      }
      try {
        const result = await productAPI.getFavorites();
        const favorites = result.data?.favorites || [];
        setIsFavorite(favorites.some((item: any) => String(item.id) === String(product.id)));
      } catch (error) {
        setIsFavorite(false);
      }
    };
    loadFavorites();
  }, [user, product?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/products/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch product');
      const result = await response.json();
      const productData = result.data?.product || result.product || result;
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = productData.images.map((img: any) => typeof img === 'string' ? { url: img } : img);
      }
      setProduct(productData);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      toast.error('Please login to contact seller');
      navigate('/auth');
      return;
    }
    setShowContactDialog(true);
  };

  const handleSendMessage = async () => {
    if (!messageForm.message) {
      toast.error('Please write a message');
      return;
    }
    const sellerId = product?.user_id || product?.seller_id || product?.seller?.user_id || product?.seller?.id;
    if (!sellerId) {
      toast.error('Seller information not available');
      return;
    }
    try {
      setSendingMessage(true);
      await messageAPI.sendMessage(String(sellerId), messageForm.subject, messageForm.message);

      toast.success('Message sent successfully!');
      setShowContactDialog(false);
      setMessageForm(prev => ({ ...prev, message: '' }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!user) {
      toast.error('Please login to add to favorites');
      navigate('/auth');
      return;
    }
    try {
      if (isFavorite) {
        await productAPI.unfavorite(String(product!.id));
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await productAPI.favorite(String(product!.id));
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update favorites');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Fetching Product Details</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center space-y-6">
          <Package className="h-24 w-24 text-muted-foreground/20 mx-auto" />
          <h2 className="text-4xl font-black italic">Listing Not Found</h2>
          <p className="text-muted-foreground text-lg">This item may have been sold or removed by the seller.</p>
          <Button onClick={() => navigate('/')} className="h-12 px-8 rounded-xl font-bold bg-blue-600">Explore Marketplace</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const finalPrice = product.discount_percentage
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="rounded-2xl h-12 px-6 group bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Results
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddToFavorites}
                className={`h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm transition-all ${isFavorite ? 'text-red-500 bg-red-50' : 'hover:scale-105'}`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={typeof product.images[selectedImage] === 'string' ? product.images[selectedImage] as string : (product.images[selectedImage] as any).url}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-20">
                    <Package className="h-24 w-24 mb-4" />
                    <span className="font-bold">No Image Available</span>
                  </div>
                )}

                {product.discount_percentage && (
                  <div className="absolute top-8 left-8 bg-black text-white px-6 py-2 rounded-2xl font-black italic text-sm tracking-widest uppercase">
                    -{product.discount_percentage}% OFF
                  </div>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all p-1 ${selectedImage === idx ? 'border-blue-600' : 'border-white dark:border-slate-900 grayscale opacity-50'}`}
                    >
                      <img
                        src={typeof img === 'string' ? img : (img as any).url}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs">
                  <Sparkles className="h-4 w-4" />
                  Premium Listing
                </div>
                <h1 className="text-4xl font-black italic tracking-tight leading-tight">
                  {product.title}
                </h1>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 glass-p px-3 py-1.5 rounded-full">
                    <Eye className="h-4 w-4" />
                    <span className="font-bold">{product.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 glass-p px-3 py-1.5 rounded-full">
                    <MapPin className="h-4 w-4" />
                    <span className="font-bold">{product.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-blue-600 text-white rounded-[2.5rem] shadow-xl shadow-blue-600/20 space-y-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <TrendingUp className="h-24 w-24" />
                </div>
                <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">Market Price</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black italic">
                    KSh {finalPrice.toLocaleString()}
                  </span>
                  {product.discount_percentage && (
                    <span className="text-xl text-blue-200/50 line-through decoration-blue-200">
                      {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Condition</p>
                  <p className="text-lg font-black italic capitalize text-blue-600">{product.condition}</p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</p>
                  <p className="text-lg font-black italic capitalize truncate">{product.category_name || product.category || 'Vconect Member'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    Listing Details
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="px-4 py-1.5 rounded-xl border-slate-200 text-slate-500 font-bold">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-slate-100 dark:bg-slate-800" />

              {/* Seller Profile Card */}
              <Card className="rounded-[2.5rem] border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl">
                          {product.seller.avatar_url || product.seller.avatar ? (
                            <img
                              src={product.seller.avatar_url || product.seller.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-black italic text-blue-600">
                              {(product.seller.display_name || 'V').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-900" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Certified Seller</p>
                        <p className="text-xl font-black italic tracking-tight">{product.seller.display_name || product.seller.name || 'Anonymous Partner'}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleContactSeller}
                        className="w-full h-16 rounded-[1.5rem] bg-slate-950 hover:bg-black text-white font-black italic text-lg tracking-tight shadow-xl transition-all hover:scale-[1.02] active:scale-100"
                      >
                        <MessageCircle className="h-6 w-6 mr-3 text-blue-400" />
                        Contact This Seller
                        <ChevronRight className="ml-auto h-5 w-5 opacity-20" />
                      </Button>

                      {(product.seller.phone_number || product.contact_phone) && (
                        <Button
                          variant="outline"
                          className="w-full h-14 rounded-2xl border-slate-200 font-bold hover:bg-slate-50 transition-all"
                          onClick={() => window.open(`https://wa.me/${(product.seller.phone_number || product.contact_phone)?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <Phone className="h-4 w-4 mr-2 text-green-500" />
                          Direct WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modernized Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-3xl">
          <DialogHeader className="p-8 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-3xl font-black italic tracking-tight">Security-First Communication</DialogTitle>
            <DialogDescription className="text-base font-medium">
              You are inquiring about <span className="text-blue-600 font-bold">"{product.title}"</span>. Our system protects your identity until you choose to share it.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Inquiry</Label>
                <Textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Ask about availability, pricing, or viewing arrangements..."
                  className="rounded-3xl bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 italic"
                  rows={6}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowContactDialog(false)} className="rounded-2xl font-bold h-12">Discard</Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageForm.message}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 font-black italic h-14 px-8 shadow-xl shadow-blue-600/20 transition-all hover:scale-105"
            >
              {sendingMessage ? "Transmitting..." : "Send Secure Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;
