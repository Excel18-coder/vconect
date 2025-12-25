import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import ProductManager from "@/components/ProductManager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";

const Sell = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const canSell =
    profile?.userType === "seller" || profile?.userType === "landlord";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seller Dashboard</CardTitle>
              <CardDescription>
                Create and manage your marketplace listings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canSell ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    Your account is currently set as a buyer. Switch your
                    account type to Seller or Landlord to create listings.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/account")}>
                    Go to Account Settings
                  </Button>
                </div>
              ) : (
                <ProductManager />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sell;
