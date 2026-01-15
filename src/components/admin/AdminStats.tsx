/**
 * Admin Statistics Component
 * Displays key metrics and analytics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authFetch } from '@/services/api-client';
import {
  Activity,
  DollarSign,
  Eye,
  MessageCircle,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Stats {
  users: {
    total_users: number;
    buyers: number;
    sellers: number;
    landlords: number;
    new_users_30d: number;
  };
  products: {
    total_products: number;
    active_products: number;
    sold_products: number;
    inactive_products: number;
    new_products_30d: number;
    total_views: number;
  };
  messages: {
    total_messages: number;
    unread_messages: number;
    messages_30d: number;
  };
  categories: Array<{
    category: string;
    product_count: number;
    total_views: number;
  }>;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await authFetch('/admin/dashboard/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total_users,
      change: `+${stats.users.new_users_30d} this month`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Products',
      value: stats.products.active_products,
      change: `+${stats.products.new_products_30d} this month`,
      icon: Package,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total Views',
      value: Number(stats.products.total_views).toLocaleString(),
      change: 'All time',
      icon: Eye,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Messages',
      value: stats.messages.total_messages,
      change: `${stats.messages.unread_messages} unread`,
      icon: MessageCircle,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Buyers',
      value: stats.users.buyers,
      change: 'Active buyers',
      icon: ShoppingBag,
      color: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'Sellers',
      value: stats.users.sellers,
      change: 'Active sellers',
      icon: TrendingUp,
      color: 'text-pink-600 dark:text-pink-400',
    },
    {
      title: 'Sold Products',
      value: stats.products.sold_products,
      change: 'All time',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Activity',
      value: stats.messages.messages_30d,
      change: 'Messages this month',
      icon: Activity,
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.categories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                      {cat.category}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {cat.product_count} products
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(cat.product_count / stats.products.new_products_30d) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                  {Number(cat.total_views).toLocaleString()} views
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminStats;
