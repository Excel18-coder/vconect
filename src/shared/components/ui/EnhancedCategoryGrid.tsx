/**
 * Enhanced Category Grid
 * Beautiful category cards with hover effects
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/utils/helpers';
import { ArrowRight, Car, Home, Music, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categories = [
  {
    value: 'house',
    label: 'Real Estate',
    icon: Home,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-white dark:bg-gray-800',
    count: '2,450+',
    description: 'Houses, Apartments & Land',
  },
  {
    value: 'transport',
    label: 'Vehicles & Transport',
    icon: Car,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-white dark:bg-gray-800',
    count: '1,820+',
    description: 'Cars, Motorcycles & Parts',
  },
  {
    value: 'market',
    label: 'Marketplace',
    icon: ShoppingBag,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-white dark:bg-gray-800',
    count: '5,600+',
    description: 'Electronics, Fashion & More',
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    icon: Music,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-white dark:bg-gray-800',
    count: '980+',
    description: 'Events, Tickets & Media',
  },
];

export function EnhancedCategoryGrid() {
  const navigate = useNavigate();

  return (
    <section className="py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-8 lg:mb-12 space-y-2 md:space-y-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Browse by Category
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore thousands of listings across multiple categories
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.value}
                className={cn(
                  'group cursor-pointer overflow-hidden border-2 border-gray-200 dark:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary',
                  category.bgColor,
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/category/${category.value}`)}
              >
                <CardContent className="p-8 relative">
                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-20">
                    <div
                      className={cn(
                        'w-full h-full rounded-full bg-gradient-to-br',
                        category.color,
                        'blur-2xl group-hover:blur-3xl transition-all duration-500'
                      )}
                    />
                  </div>

                  {/* Icon */}
                  <div className="relative mb-6">
                    <div
                      className={cn(
                        'inline-flex p-4 rounded-2xl bg-gradient-to-br shadow-lg',
                        category.color,
                        'transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6'
                      )}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                      {category.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {category.description}
                    </p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {category.count} listings
                    </p>

                    {/* Arrow */}
                    <div className="pt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
                      <span>Explore Now</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default EnhancedCategoryGrid;
