/**
 * Enhanced Product Card Component
 * Beautiful card with hover effects and animations
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Product } from '@/shared/types';
import { cn, formatCurrency, formatRelativeTime } from '@/shared/utils/helpers';
import { Clock, Eye, Heart, MapPin } from 'lucide-react';
import { useState } from 'react';

interface EnhancedProductCardProps {
  product: Product;
  onFavorite?: (id: string | number) => void;
  onClick?: () => void;
  isFavorited?: boolean;
}

export function EnhancedProductCard({
  product,
  onFavorite,
  onClick,
  isFavorited = false,
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFavorited(!localFavorited);
    onFavorite?.(product.id);
  };

  const imageUrl =
    Array.isArray(product.images) && product.images.length > 0
      ? typeof product.images[0] === 'string'
        ? product.images[0]
        : product.images[0].url
      : '/placeholder.jpg';

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl border-0 bg-white dark:bg-gray-900',
        isHovered && 'scale-[1.02]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <img
          src={imageUrl}
          alt={product.title}
          className={cn(
            'h-full w-full object-cover transition-all duration-500',
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110',
            isHovered && 'scale-110'
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.status === 'active' && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg">
              Available
            </Badge>
          )}
          {product.condition && (
            <Badge variant="secondary" className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
              {product.condition}
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'absolute top-3 right-3 rounded-full backdrop-blur-sm transition-all duration-300',
            localFavorited
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 hover:bg-white dark:bg-gray-900/90',
            'opacity-0 group-hover:opacity-100'
          )}
          onClick={handleFavorite}
        >
          <Heart className={cn('h-4 w-4 transition-all', localFavorited && 'fill-current')} />
        </Button>

        {/* Quick Stats */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-1 text-xs">
            <Eye className="h-3 w-3" />
            <span>{product.views || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(product.createdAt)}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-2 text-gray-900 dark:text-white transition-colors">
          {product.title}
        </h3>

        {/* Location */}
        {product.location && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-3.5 w-3.5" />
            <span className="capitalize">{product.location}</span>
          </div>
        )}

        {/* Description Preview */}
        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {/* Price */}
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(product.price, product.currency)}
          </span>
        </div>

        {/* View Button */}
        <Button size="sm" className="transition-all duration-300 group-hover:scale-105">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

export default EnhancedProductCard;
