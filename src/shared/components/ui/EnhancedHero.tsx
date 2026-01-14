/**
 * Enhanced Hero Section
 * Eye-catching hero with animated gradients and search
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils/helpers';
import { MapPin, Package, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function EnhancedHero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const popularSearches = ['Apartments', 'Cars', 'Vehicles', 'Electronics', 'Furniture', 'Land'];
  const stats = [
    { icon: Package, label: 'Active Listings', value: '10,000+' },
    { icon: TrendingUp, label: 'Daily Views', value: '50,000+' },
    { icon: MapPin, label: 'Cities Covered', value: '47' },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6 lg:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">Kenya's #1 Marketplace</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-slide-up">
            <span className="text-blue-600 dark:text-blue-400">Find Anything</span>
            <br />
            <span className="text-gray-900 dark:text-white">You Need</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 font-medium max-w-2xl mx-auto animate-slide-up animation-delay-200">
            Buy, sell, and discover amazing deals on homes, vehicles, electronics, and more across
            Kenya.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="animate-slide-up animation-delay-400">
            <div
              className={cn(
                'relative max-w-2xl mx-auto transition-all duration-300',
                isFocused && 'scale-[1.02]'
              )}
            >
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for products, categories, or locations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full pl-12 pr-32 py-6 text-lg rounded-full border-2 focus:border-primary shadow-lg transition-all duration-300"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="absolute right-2 rounded-full px-8 transition-all duration-300 hover:scale-105"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Popular:
              </span>
              {popularSearches.map((term, index) => (
                <Button
                  key={term}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(term);
                    navigate(`/search?q=${encodeURIComponent(term)}`);
                  }}
                  className="rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-all duration-300"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  {term}
                </Button>
              ))}
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-slide-up animation-delay-600">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="relative group"
                  style={{ animationDelay: `${800 + index * 100}ms` }}
                >
                  <div className="relative p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:scale-105">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            className="fill-background"
          />
        </svg>
      </div>
    </div>
  );
}

export default EnhancedHero;
