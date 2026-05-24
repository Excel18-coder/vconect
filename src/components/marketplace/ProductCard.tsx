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
        <Card className={`group overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-hover transition-all duration-300 bg-white dark:bg-slate-950 ${viewMode === "list" ? "flex flex-col md:flex-row" : "flex flex-col h-full"}`}>
            {/* Image Section */}
            <div
                className={`relative overflow-hidden cursor-pointer ${viewMode === "list" ? "w-full md:w-64 h-48 md:h-auto" : "aspect-[4/3]"}`}
                onClick={() => navigate(`/product/${product.id}`)}
            >
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                        <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">No Image</span>
                    </div>
                )}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 backdrop-blur border-0 shadow-sm font-bold">
                        {product.category}
                    </Badge>
                </div>
            </div>

            {/* Content Section */}
            <div className={`flex flex-col flex-1 p-5 ${viewMode === "list" ? "md:p-6" : ""}`}>
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                            <h3
                                className="text-lg font-bold line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                {product.title}
                            </h3>
                            <div className="flex items-center text-xs text-muted-foreground gap-3">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {product.location}
                                </span>
                                <span>•</span>
                                <span>{displayDate}</span>
                            </div>
                        </div>
                        {user && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                                onClick={() => onAddToFavorites(String(product.id))}
                            >
                                <Heart className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                            {formattedPrice}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <Eye className="h-3.5 w-3.5" />
                            {product.views}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row gap-3">
                    <Button
                        className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold h-11"
                        onClick={() => onContactSeller(product)}
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Seller
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 font-bold h-11"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        View Details
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ProductCard;
