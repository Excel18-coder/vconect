import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertCircle,
  DollarSign,
  ImagePlus,
  MapPin,
  Package,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PostAd = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    condition: "new",
    location: "",
    stock_quantity: "1",
    discount_percentage: "0",
    weight: "",
    shipping_cost: "0",
  });

  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const categories = [
    {
      value: "house",
      label: "Real Estate",
      subcategories: ["Apartment", "House", "Land", "Commercial"],
    },
    {
      value: "transport",
      label: "Transportation",
      subcategories: ["Cars", "Motorcycles", "Bicycles", "Parts"],
    },
    {
      value: "market",
      label: "Marketplace",
      subcategories: ["Electronics", "Furniture", "Clothing", "Books", "Other"],
    },
    {
      value: "entertainment",
      label: "Entertainment",
      subcategories: ["Events", "Tickets", "Equipment"],
    },
  ];

  const conditions = [
    { value: "new", label: "Brand New" },
    { value: "like_new", label: "Like New" },
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
    { value: "used", label: "Used" },
  ];

  const locations = [
    "Nairobi",
    "Mombasa",
    "Kisumu",
    "Nakuru",
    "Eldoret",
    "Thika",
    "Malindi",
    "Kitale",
    "Garissa",
    "Kakamega",
  ];

  // Redirect if not logged in
  if (!user) {
    toast.error("Please login to post an ad");
    navigate("/auth");
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + imageFiles.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setImageFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a product title");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a product description");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.location) {
      toast.error("Please select a location");
      return;
    }
    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Please login again");
        navigate("/auth");
        return;
      }

      // Create FormData for multipart upload
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", formData.category);
      if (formData.subcategory) {
        formDataToSend.append("subcategory", formData.subcategory);
      }
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("stock_quantity", formData.stock_quantity);
      formDataToSend.append(
        "discount_percentage",
        formData.discount_percentage
      );

      if (formData.weight) {
        formDataToSend.append("weight", formData.weight);
      }
      formDataToSend.append("shipping_cost", formData.shipping_cost);

      // Add tags as comma-separated string
      if (tags.length > 0) {
        formDataToSend.append("tags", tags.join(","));
      }

      // Add images
      imageFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const response = await fetch(`${apiUrl}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Product posted successfully!");
        navigate("/sell");
      } else {
        toast.error(data.message || "Failed to post product");
      }
    } catch (error) {
      console.error("Error posting product:", error);
      toast.error("Failed to post product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.value === formData.category
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Post Your Ad</h1>
            <p className="text-muted-foreground">
              Fill in the details below to list your product on Vconect
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., iPhone 14 Pro Max 256GB"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    maxLength={255}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.title.length}/255 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product in detail..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={6}
                    maxLength={5000}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.description.length}/5000 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        handleInputChange("category", value);
                        handleInputChange("subcategory", "");
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCategory &&
                    selectedCategory.subcategories.length > 0 && (
                      <div>
                        <Label htmlFor="subcategory">Subcategory</Label>
                        <Select
                          value={formData.subcategory}
                          onValueChange={(value) =>
                            handleInputChange("subcategory", value)
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedCategory.subcategories.map((sub) => (
                              <SelectItem key={sub} value={sub.toLowerCase()}>
                                {sub}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                </div>

                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      handleInputChange("condition", value)
                    }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((cond) => (
                        <SelectItem key={cond.value} value={cond.value}>
                          {cond.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (KSh) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      placeholder="1"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        handleInputChange("stock_quantity", e.target.value)
                      }
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount_percentage">Discount %</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      placeholder="0"
                      value={formData.discount_percentage}
                      onChange={(e) =>
                        handleInputChange("discount_percentage", e.target.value)
                      }
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping_cost">Shipping Cost (KSh)</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      placeholder="0.00"
                      value={formData.shipping_cost}
                      onChange={(e) =>
                        handleInputChange("shipping_cost", e.target.value)
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {formData.discount_percentage &&
                  parseFloat(formData.discount_percentage) > 0 && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Final Price: KSh{" "}
                        {(
                          parseFloat(formData.price || "0") *
                          (1 -
                            parseFloat(formData.discount_percentage || "0") /
                              100)
                        ).toFixed(2)}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Location & Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) =>
                        handleInputChange("location", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc.toLowerCase()}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="weight">Weight (kg) - Optional</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="0.0"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5" />
                  Product Images *
                </CardTitle>
                <CardDescription>
                  Upload up to 10 images. First image will be the main photo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <Label htmlFor="images" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>Choose Images</span>
                    </Button>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    {imageFiles.length}/10 images uploaded
                  </p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <Badge className="absolute top-2 left-2">Main</Badge>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
                <CardDescription>
                  Add tags to help buyers find your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., smartphone, 5G, camera"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add Tag
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}>
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/sell")}
                disabled={loading}
                className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Posting...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Post Product
                  </>
                )}
              </Button>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Before you post:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ensure all information is accurate</li>
                    <li>Upload clear, high-quality images</li>
                    <li>Set a competitive price</li>
                    <li>Be responsive to buyer inquiries</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostAd;
