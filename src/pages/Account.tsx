import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth-optimized';
import { Container, MainLayout, PageHeader, Section } from '@/shared/components/layout';
import { Mail, MapPin, User } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const Account = () => {
  const { user, profile, loading, signOut, isSeller, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <PageHeader
        title="My Account"
        description="Review your profile, seller status, and account actions."
      />

      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Details
                </CardTitle>
                <CardDescription>Signed in as {user?.email}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Display Name</div>
                  <div className="mt-1 font-semibold">{profile?.displayName || 'Not set'}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Email</div>
                  <div className="mt-1 font-semibold break-all flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Location</div>
                  <div className="mt-1 font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {profile?.location || 'Not set'}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Role</div>
                  <div className="mt-1 font-semibold capitalize">{profile?.userType || 'buyer'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage listings and account access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => navigate('/sell')} disabled={!isSeller && !isAdmin}>
                  Go to Seller Tools
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/post-ad')}>
                  Post an Ad
                </Button>
                <Button variant="destructive" className="w-full" onClick={signOut}>
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </MainLayout>
  );
};

export default Account;