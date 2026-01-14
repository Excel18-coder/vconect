/**
 * Product Card Component
 * Displays product information with interactive features
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/utils/helpers';
import { DollarSign, Eye, Heart, MapPin, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export interface ProductCardProps {
  id: string | number;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  category: string;
  condition?: string;
  views?: number;
  isFavorite?: boolean;
  onFavoriteClick?: () => void;
  onContactClick?: () => void;
  compact?: boolean;
}

export function ProductCard({
  id,
  title,
  description,
  price,
  location,
  images,
  category,
  condition,
  views,
  isFavorite = false,
  onFavoriteClick,
  onContactClick,
  compact = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const imageUrl = images && images.length > 0 ? images[0] : '/placeholder-product.png';

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-hover hover:-translate-y-1">
      <Link to={`/product/${id}`} className="block">
        {/* Image Section */}
        <div
          className="relative overflow-hidden bg-gray-100 dark:bg-gray-800"
          style={{ paddingTop: '75%' }}
        >
          {/* Loading Skeleton */}
          {isImageLoading && <div className="absolute inset-0 animate-shimmer" />}

          {/* Product Image */}
          <img
            src={imageError ? '/placeholder-product.png' : imageUrl}
            alt={title}
            onError={() => setImageError(true)}
            onLoad={() => setIsImageLoading(false)}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-all duration-500',
              'group-hover:scale-110',
              isImageLoading ? 'opacity-0' : 'opacity-100'
            )}
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {condition && (
              <Badge variant="secondary" className="glass glass-border backdrop-blur-sm text-xs">
                {condition}
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          {onFavoriteClick && (
            <button
              onClick={e => {
                e.preventDefault();
                onFavoriteClick();
              }}
              className={cn(
                'absolute top-2 right-2 p-2 rounded-full transition-all duration-300',
                'glass glass-border backdrop-blur-sm',
                'hover:scale-110 opacity-0 group-hover:opacity-100',
                isFavorite && 'opacity-100'
              )}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-300'
                )}
              />
            </button>
          )}
        </div>
      </Link>

      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        {/* Title & Price */}
        <div className="space-y-1">
          <Link to={`/product/${id}`}>
            <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              KSh {price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Description */}
        {!compact && (
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        {/* Location & Views */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="capitalize">{location}</span>
          </div>
          {views !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{views}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {onContactClick && (
          <Button
            onClick={e => {
              e.preventDefault();
              onContactClick();
            }}
            size="sm"
            className="w-full transition-all duration-300 hover:shadow-glow"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Seller
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductCard;
