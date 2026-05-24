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
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <div className="container mx-auto px-4 py-40 flex flex-col items-center justify-center space-y-8">
          <div className="h-16 w-16 border-4 border-slate-100 border-t-accent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Retrieving Asset Intelligence...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header />
        <div className="container mx-auto px-4 py-40 text-center space-y-8">
          <Package className="h-24 w-24 text-slate-100 mx-auto" />
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-primary dark:text-white">Asset Terminated</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">This registry entry has been sold or purged from the marketplace.</p>
          <Button onClick={() => navigate('/')} className="h-12 px-10 rounded-sm font-black uppercase tracking-widest text-[10px] bg-primary text-white">Return to Directory</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const finalPrice = product.discount_percentage
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-20 pb-40">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="rounded-sm h-10 px-6 group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="h-3 w-3 mr-3 group-hover:-translate-x-1 transition-transform" />
              Return to Catalog
            </Button>

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddToFavorites}
                className={`h-10 w-10 rounded-sm bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm transition-all ${isFavorite ? 'text-red-500 border-red-100' : 'hover:scale-105'}`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                className="h-10 w-10 rounded-sm bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Gallery Section */}
            <div className="lg:col-span-7 space-y-8">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 shadow-premium">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={typeof product.images[selectedImage] === 'string' ? product.images[selectedImage] as string : (product.images[selectedImage] as any).url}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-200">
                    <Package className="h-24 w-24 mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Missing Visual Asset</span>
                  </div>
                )}

                {product.discount_percentage && (
                  <div className="absolute top-6 left-6 bg-primary text-white px-6 py-2 rounded-sm font-black italic text-[10px] tracking-widest uppercase">
                    -{product.discount_percentage}% VALUE ADJUSTMENT
                  </div>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-1 overflow-x-auto pb-4 no-scrollbar">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-24 h-20 rounded-sm overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-accent shadow-premium' : 'border-slate-50 dark:border-slate-900 opacity-60 hover:opacity-100'}`}
                    >
                      <img
                        src={typeof img === 'string' ? img : (img as any).url}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-accent font-black uppercase tracking-[0.3em] text-[10px]">
                  <Sparkles className="h-4 w-4" />
                  Executive Tier Asset
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter leading-[0.95] text-primary dark:text-white uppercase">
                  {product.title}
                </h1>
                <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-accent" />
                    <span>{product.views || 0} Intelligence views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-accent" />
                    <span>Registry: {product.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-primary text-white rounded-lg shadow-premium space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                  <TrendingUp className="h-32 w-32" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Market Valuation</p>
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-black italic tracking-tighter">
                    KSh {finalPrice.toLocaleString()}
                  </span>
                  {product.discount_percentage && (
                    <span className="text-xl text-slate-500 line-through decoration-accent decoration-2">
                      {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="pt-4 flex items-center gap-2">
                  <div className="h-1 w-8 bg-accent rounded-full"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent">Active Transaction Window</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="p-8 bg-white dark:bg-slate-900 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Asset Condition</p>
                  <p className="text-xl font-black italic uppercase tracking-tighter text-primary dark:text-white">{product.condition}</p>
                </div>
                <div className="p-8 bg-white dark:bg-slate-900 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sector</p>
                  <p className="text-xl font-black italic uppercase tracking-tighter truncate text-primary dark:text-white">{product.category_name || product.category || 'Vconect Member'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                    <div className="h-4 w-1 bg-accent rounded-full"></div>
                    Registry Brief
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>
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
            <div className="lg:col-span-12">
              <Card className="rounded-lg border-0 shadow-premium bg-slate-50 dark:bg-slate-900 overflow-hidden group">
                <CardContent className="p-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex items-center gap-8">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-sm bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                          {product.seller.avatar_url || product.seller.avatar ? (
                            <img
                              src={product.seller.avatar_url || product.seller.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl font-black italic text-primary dark:text-white">
                              {(product.seller.display_name || 'V').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full border-4 border-white dark:border-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Certified Asset Partner</p>
                        <p className="text-3xl font-black italic tracking-tighter text-primary dark:text-white uppercase leading-none">{product.seller.display_name || product.seller.name || 'Anonymous Partner'}</p>
                        <div className="flex items-center gap-2 pt-2">
                          <Star className="h-3 w-3 text-accent fill-accent" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified Marketplace Status</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                      <Button
                        onClick={handleContactSeller}
                        className="h-16 px-12 rounded-sm bg-primary hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-sm transition-all active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4 mr-3" />
                        Initiate Secure Inquiry
                      </Button>

                      {(product.seller.phone_number || product.contact_phone) && (
                        <Button
                          variant="outline"
                          className="h-16 px-10 rounded-sm border-2 border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          onClick={() => window.open(`https://wa.me/${(product.seller.phone_number || product.contact_phone)?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <Phone className="h-4 w-4 mr-3 text-green-500" />
                          Direct Protocol
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
        <DialogContent className="max-w-md rounded-sm p-0 overflow-hidden border-0 shadow-premium">
          <DialogHeader className="p-10 bg-slate-950 text-white">
            <div className="flex items-center gap-3 text-accent font-black uppercase tracking-[0.3em] text-[8px] mb-2">
              <Shield className="h-3 w-3" />
              Secure Communication Protocol
            </div>
            <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">Initiate Inquiry</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Asset: <span className="text-white">{product.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Message Body</Label>
                <Textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Formulate your inquiry to the asset partner..."
                  className="rounded-sm bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-medium text-sm focus:border-primary/20 transition-all p-6"
                  rows={6}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setShowContactDialog(false)} className="text-[10px] font-black uppercase tracking-widest">Abort</Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageForm.message}
              className="bg-primary hover:bg-black text-white font-black uppercase tracking-widest text-[10px] px-10 h-14 rounded-sm shadow-sm transition-transform active:scale-95"
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
