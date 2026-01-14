/**
 * Admin Dashboard Page
 * Comprehensive admin panel for managing the entire system
 */

import {
  ActivityLog,
  AdminProfileSettings,
  AnalyticsDashboard,
  CategoryManagement,
  MessageManagement,
  ProductManagement,
  UserManagement,
} from '@/components/admin';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import SEO from '@/shared/components/seo/SEO';
import {
  Activity,
  BarChart3,
  FolderOpen,
  MessageSquare,
  Package,
  Settings,
  Users,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || profile?.userType !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO
        title="Admin Dashboard | VCONECT"
        description="Administrative panel for managing users, products, and system operations"
        url="https://vconect.com/admin"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage and monitor your marketplace
                </p>
              </div>
              <Badge variant="destructive" className="text-lg px-4 py-2">
                Admin Access
              </Badge>
            </div>

            {/* Tabs Navigation */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Products</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Messages</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Categories</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <AnalyticsDashboard />
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products">
                <ProductManagement />
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <MessageManagement />
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories">
                <CategoryManagement />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <ActivityLog />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <AdminProfileSettings />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
