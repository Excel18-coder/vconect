import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MessagesView from "@/components/MessagesView";
import ProductManager from "@/components/ProductManager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  Briefcase,
  Car,
  DollarSign,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Package,
  PlayCircle,
  Settings,
  ShoppingBag,
  Stethoscope,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const Account = () => {
  const { user, profile, updateProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    phone_number: "",
    location: "",
    user_type: "buyer",
  });

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      [
        "overview",
        "settings",
        "activity",
        "favorites",
        "products",
        "analytics",
      ].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  // Initialize form data when profile is loaded
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        display_name: profile.displayName || "",
        bio: profile.bio || "",
        phone_number: profile.phoneNumber || "",
        location: profile.location || "",
        user_type: profile.userType || "buyer",
      });
    }
  }, [profile, isEditing]);

  const handleUpdateProfile = async () => {
    // Prepare update data - only send fields that are not empty
    const updateData: any = {
      display_name: formData.display_name.trim(),
      user_type: formData.user_type,
    };

    // Only add optional fields if they have values
    if (formData.bio && formData.bio.trim()) {
      updateData.bio = formData.bio.trim();
    }

    if (formData.phone_number && formData.phone_number.trim()) {
      updateData.phone_number = formData.phone_number.trim();
    }

    if (formData.location && formData.location.trim()) {
      updateData.location = formData.location.trim();
    }

    // Validate required fields
    if (!updateData.display_name) {
      toast.error("Display name is required");
      return;
    }

    const { error } = await updateProfile(updateData);
    if (!error) {
      setIsEditing(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";
  };

  const getUserTypeIcon = (type: string) => {
    const iconMap = {
      buyer: ShoppingBag,
      seller: DollarSign,
      landlord: Home,
      employer: Briefcase,
      doctor: Stethoscope,
      tutor: User,
      admin: Settings,
    };
    const Icon = iconMap[type as keyof typeof iconMap] || User;
    return <Icon className="h-4 w-4" />;
  };

  const getUserTypeColor = (type: string) => {
    const colorMap = {
      buyer: "bg-primary",
      seller: "bg-secondary",
      landlord: "bg-accent",
      employer: "bg-muted",
      doctor: "bg-primary",
      tutor: "bg-secondary",
      admin: "bg-destructive",
    };
    return colorMap[type as keyof typeof colorMap] || "bg-muted";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={profile?.avatarUrl}
                    alt={profile?.displayName || "User"}
                  />
                  <AvatarFallback className="text-xl">
                    {getInitials(profile?.displayName || user.email || "User")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-primary mb-2">
                    {profile?.displayName || user.email}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                    <Badge
                      className={`${getUserTypeColor(
                        profile?.userType
                      )} text-white`}>
                      {getUserTypeIcon(profile?.userType)}
                      <span className="ml-2 capitalize">
                        {profile?.userType || "buyer"}
                      </span>
                    </Badge>
                    {profile?.location && (
                      <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.location}
                      </Badge>
                    )}
                  </div>
                  {profile?.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <Button
                      onClick={() => {
                        setIsEditing(true);
                        setActiveTab("settings");
                      }}
                      variant="outline"
                      size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button onClick={signOut} variant="destructive" size="sm">
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Welcome Message */}
          {(profile?.userType === "seller" ||
            profile?.userType === "landlord" ||
            profile?.userType === "employer") && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-pink-500/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      Welcome to Your Seller Dashboard!
                    </h3>
                    <p className="text-muted-foreground">
                      Ready to start selling? Click on the "Products" tab to
                      upload your first product and start earning!
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab("products")}
                    className="bg-gradient-to-r from-primary to-pink-500">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Products
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="messages">
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              {(profile?.userType === "seller" ||
                profile?.userType === "landlord" ||
                profile?.userType === "employer") && (
                <TabsTrigger value="products" className="hidden lg:flex">
                  Products
                </TabsTrigger>
              )}
              <TabsTrigger value="analytics" className="hidden lg:flex">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Account Type
                    </CardTitle>
                    {getUserTypeIcon(profile?.userType)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">
                      {profile?.userType || "Buyer"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your marketplace role
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Member Since
                    </CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Date(profile?.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Account creation date
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Status
                    </CardTitle>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      Active
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Account status
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks for your account type
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4"
                    onClick={() => navigate("/search")}>
                    <ShoppingBag className="h-6 w-6" />
                    <span>Browse Products</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4"
                    onClick={() =>
                      console.log("TODO: Implement favorites page")
                    }>
                    <Heart className="h-6 w-6" />
                    <span>View Favorites</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4"
                    onClick={() => navigate("/category/transport")}>
                    <Car className="h-6 w-6" />
                    <span>Book Transport</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4"
                    onClick={() => navigate("/category/entertainment")}>
                    <PlayCircle className="h-6 w-6" />
                    <span>Entertainment</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your account information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="display_name">
                            Display Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="display_name"
                            value={formData.display_name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                display_name: e.target.value,
                              }))
                            }
                            placeholder="Enter your display name"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            This name will be visible to other users
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone_number">
                            Phone Number (Optional)
                          </Label>
                          <Input
                            id="phone_number"
                            value={formData.phone_number}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                phone_number: e.target.value,
                              }))
                            }
                            placeholder="+254712345678"
                            type="tel"
                          />
                          <p className="text-xs text-muted-foreground">
                            Buyers can contact you via this number
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location (Optional)</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                            placeholder="e.g., Nairobi, Westlands"
                          />
                          <p className="text-xs text-muted-foreground">
                            Your general location
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user_type">
                            Account Type{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.user_type}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                user_type: value,
                              }))
                            }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyer">Buyer</SelectItem>
                              <SelectItem value="seller">Seller</SelectItem>
                              <SelectItem value="landlord">Landlord</SelectItem>
                              <SelectItem value="employer">Employer</SelectItem>
                              <SelectItem value="doctor">Doctor</SelectItem>
                              <SelectItem value="tutor">Tutor</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Your role in the marketplace
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio (Optional)</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                          placeholder="Tell us about yourself..."
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.bio.length}/500 characters
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={loading}>
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={loading}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm text-muted-foreground">
                            {profile?.phoneNumber || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline">
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>
                    View and manage your conversations with buyers and sellers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MessagesView />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your recent marketplace interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No recent activity to display.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Favorites & Wishlist</CardTitle>
                  <CardDescription>
                    Items and services you've saved for later
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No favorites saved yet.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {(profile?.userType === "seller" ||
              profile?.userType === "landlord" ||
              profile?.userType === "employer") && (
              <TabsContent value="products" className="space-y-6">
                <ProductManager />
              </TabsContent>
            )}

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>
                    Insights into your marketplace performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-32">
                    <TrendingUp className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    Analytics will be available once you start using the
                    platform.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
