import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { messageAPI } from '@/services/api';
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
} from 'lucide-react';

interface Product {
  id: number;
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
  seller: {
    id: number;
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

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Set default message subject when product loads
  useEffect(() => {
    if (product) {
      setMessageForm(prev => ({
        ...prev,
        subject: `Inquiry about: ${product.title}`,
      }));
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const result = await response.json();
      // Backend returns {success: true, data: {product: {...}}}
      const productData = result.data?.product || result.product || result;
      
      // Normalize images format - backend returns array of strings, frontend expects objects with url
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = productData.images.map((img: string | { url: string }) => 
          typeof img === 'string' ? { url: img } : img
        );
      }
      
      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
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
    if (!messageForm.subject || !messageForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!product?.seller?.id) {
      toast.error('Seller information not available');
      return;
    }

    try {
      setSendingMessage(true);
      await messageAPI.sendMessage(
        product.seller.id,
        messageForm.subject,
        messageForm.message
      );
      
      toast.success('Message sent successfully!');
      setShowContactDialog(false);
      setMessageForm({
        subject: `Inquiry about: ${product.title}`,
        message: '',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
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
    // TODO: Implement add to favorites API
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.title,
      text: product?.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const calculateFinalPrice = () => {
    if (!product) return 0;
    if (product.discount_percentage) {
      return product.price * (1 - product.discount_percentage / 100);
    }
    return product.price;
  };

  // Format phone number for WhatsApp (basic cleaning + small Kenya-friendly heuristic)
  const getWhatsAppUrl = (phone: string | undefined, text: string) => {
    if (!phone) return null;
    let digits = phone.replace(/\D/g, '');
    if (!digits) return null;

    // If number starts with 0, assume local Kenyan number and prefix 254
    if (/^0+/.test(digits)) {
      digits = '254' + digits.replace(/^0+/, '');
    }

    // If number had a leading + then digits already include country code
    // Ensure it's not too short
    if (digits.length < 8) return null;

    const encoded = encodeURIComponent(text || 'Hello, I am interested in your listing');
    return `https://wa.me/${digits}?text=${encoded}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Button onClick={() => navigate('/search')}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {product.images && product.images.length > 0 ? (
              <img
                src={
                  typeof product.images[selectedImage] === 'string' 
                    ? product.images[selectedImage] as string
                    : (product.images[selectedImage] as { url: string })?.url
                }
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            {product.discount_percentage && product.discount_percentage > 0 && (
              <Badge className="absolute top-4 right-4 bg-red-500">
                -{product.discount_percentage}% OFF
              </Badge>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={typeof image === 'string' ? image : image.url}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddToFavorites}
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{product.views || product.views_count || 0} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-primary">
                KES {calculateFinalPrice().toLocaleString()}
              </span>
              {product.discount_percentage && product.discount_percentage > 0 && (
                <span className="text-lg text-muted-foreground line-through">
                  KES {product.price.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mb-4">
              <Badge variant="secondary">{product.category_name || product.category || 'General'}</Badge>
              {product.subcategory && (
                <Badge variant="outline">{product.subcategory}</Badge>
              )}
              <Badge variant="outline">{product.condition}</Badge>
              <Badge
                variant={product.status === 'active' ? 'default' : 'secondary'}
                className={product.status === 'active' ? 'bg-green-500' : ''}
              >
                {product.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{product.location}</span>
            </div>
            
            {product.stock_quantity && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{product.stock_quantity} units available</span>
              </div>
            )}

            {product.weight && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Weight: {product.weight} kg</span>
              </div>
            )}

            {product.shipping_cost !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Shipping: KES {product.shipping_cost}</span>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {product.tags && product.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Seller Info */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Seller Information</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {(product.seller.avatar_url || product.seller.avatar || product.seller.seller_avatar) ? (
                    <img
                      src={product.seller.avatar_url || product.seller.avatar || product.seller.seller_avatar}
                      alt={product.seller.display_name || product.seller.name || product.seller.seller_name || 'Seller'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold">
                      {(product.seller.display_name || product.seller.name || product.seller.seller_name || 'S').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{product.seller.display_name || product.seller.name || product.seller.seller_name || 'Seller'}</p>
                  <p className="text-sm text-muted-foreground">{product.seller.location || product.seller.seller_location || 'Verified Seller'}</p>
                </div>
              </div>
              <Button className="w-full" onClick={handleContactSeller}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Seller
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Seller Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
            <DialogDescription>
              Send a message to {product.seller.display_name || product.seller.name || product.seller.seller_name || 'the seller'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Seller Contact Info */}
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${product.seller.email || product.seller.seller_email}`}
                  className="text-sm hover:underline"
                >
                  {product.seller.email || product.seller.seller_email}
                </a>
              </div>
              {(product.seller.phone || product.seller.phone_number || product.seller.seller_phone || product.contact_phone || product.contactPhone) && (
                <>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${product.seller.phone || product.seller.phone_number || product.seller.seller_phone || product.contact_phone || product.contactPhone}`}
                      className="text-sm hover:underline"
                    >
                      {product.seller.phone || product.seller.phone_number || product.seller.seller_phone || product.contact_phone || product.contactPhone}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                    onClick={() => {
                      const phone = (product.seller.phone || product.seller.phone_number || product.seller.seller_phone || product.contact_phone || product.contactPhone)?.replace(/\D/g, '');
                      const message = encodeURIComponent(`Hi, I'm interested in your product: ${product.title}`);
                      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact via WhatsApp
                  </Button>
                </>
              )}
            </div>

            <Separator />

            {/* Message Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter subject"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
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
              disabled={sendingMessage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageForm.subject || !messageForm.message}
            >
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

export default ProductDetail;
