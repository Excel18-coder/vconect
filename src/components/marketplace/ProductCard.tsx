import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Eye, Heart, MapPin, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    };
    seller_name?: string;
    createdAt?: string;
    created_at?: string;
}

interface ProductCardProps {
    product: Product;
    viewMode: "grid" | "list";
    user: any;
    onContactSeller: (product: Product) => void;
    onAddToFavorites: (productId: string) => void;
}

const ProductCard = ({ product, viewMode, user, onContactSeller, onAddToFavorites }: ProductCardProps) => {
    const navigate = useNavigate();

    const formattedPrice = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KSh',
        minimumFractionDigits: 0
    }).format(product.price);

    const displaySeller = product.seller?.display_name || product.seller_name || "Seller";
    const displayDate = product.createdAt || product.created_at
        ? new Date(product.createdAt || product.created_at!).toLocaleDateString()
        : "";

    return (
        <Card className={`group overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-premium transition-all duration-500 bg-white dark:bg-slate-950 ${viewMode === "list" ? "flex flex-col md:flex-row" : "flex flex-col h-full"} rounded-lg`}>
            {/* Image Section */}
            <div
                className={`relative overflow-hidden cursor-pointer ${viewMode === "list" ? "w-full md:w-72 h-64 md:h-auto" : "aspect-[3/4]"}`}
                onClick={() => navigate(`/product/${product.id}`)}
            >
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black">Private Inventory</span>
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/90 dark:bg-white/90 text-white dark:text-primary backdrop-blur-md border-0 shadow-sm font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-sm">
                        {product.category}
                    </Badge>
                </div>
            </div>

            {/* Content Section */}
            <div className={`flex flex-col flex-1 p-6 ${viewMode === "list" ? "md:p-8" : ""}`}>
                <div className="flex-1 space-y-5">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5">
                            <h3
                                className="text-xl font-black italic tracking-tight text-primary dark:text-white line-clamp-1 cursor-pointer hover:opacity-70 transition-opacity uppercase"
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                {product.title}
                            </h3>
                            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 gap-4">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3 text-accent" />
                                    {product.location}
                                </span>
                                <span className="text-slate-200">|</span>
                                <span>{displayDate}</span>
                            </div>
                        </div>
                        {user && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToFavorites(String(product.id));
                                }}
                            >
                                <Heart className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                        {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-2xl font-black text-primary dark:text-white tracking-tighter">
                            {formattedPrice}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-sm">
                            <Eye className="h-3 w-3 text-accent" />
                            {product.views} Views
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button
                        className="flex-1 rounded-sm bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs h-12 shadow-sm transition-transform active:scale-95"
                        onClick={() => onContactSeller(product)}
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Acquire Information
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 rounded-sm border-2 border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-xs h-12 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        Review Portfolio
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ProductCard;
