import {
  ActivityLog,
  AdminProfileSettings,
  AnalyticsDashboard,
  CategoryManagement,
  MessageManagement,
  ProductManagement,
  UserManagement,
} from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth-optimized';
import { Container, MainLayout, PageHeader, Section } from '@/shared/components/layout';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, loading, isAdmin } = useAuth();

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!loading && !isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return (
    <MainLayout showNavigation={false}>
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, products, categories, and platform analytics."
      />

      <Section>
        <Container>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="flex w-full flex-wrap justify-start gap-2 h-auto p-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AnalyticsDashboard />
            </TabsContent>
            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>
            <TabsContent value="categories">
              <CategoryManagement />
            </TabsContent>
            <TabsContent value="messages">
              <MessageManagement />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityLog />
            </TabsContent>
            <TabsContent value="profile">
              <AdminProfileSettings />
            </TabsContent>
          </Tabs>
        </Container>
      </Section>
    </MainLayout>
  );
};

export default AdminDashboard;