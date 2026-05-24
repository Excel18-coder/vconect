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
import { useAuth } from "@/hooks/useAuth-optimized";
import { API_CONFIG } from "@/config/api";
import {
  AlertCircle,
  CloudUpload,
  DollarSign,
  ImagePlus,
  MapPin,
  Package,
  PlusCircle,
  Tag,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
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

  const CUSTOM_OPTION_VALUE = "__custom__";
  const [customCategory, setCustomCategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [customLocation, setCustomLocation] = useState("");

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

  const apiUrl = API_CONFIG.BASE_URL;

  const categories = [
    {
      value: "housing",
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

  if (!user) {
    toast.error("Please login to post an ad");
    navigate("/auth");
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const effectiveCategory =
      formData.category === CUSTOM_OPTION_VALUE
        ? customCategory.trim()
        : formData.category;
    const effectiveSubcategory =
      formData.subcategory === CUSTOM_OPTION_VALUE
        ? customSubcategory.trim()
        : formData.subcategory;
    const effectiveLocation =
      formData.location === CUSTOM_OPTION_VALUE
        ? customLocation.trim()
        : formData.location;

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
    if (!effectiveCategory) {
      toast.error("Please select or type a category");
      return;
    }
    if (!effectiveLocation) {
      toast.error("Please select or type a location");
      return;
    }
    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", effectiveCategory);
      formDataToSend.append("subcategory", effectiveSubcategory);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("location", effectiveLocation);
      formDataToSend.append("stock_quantity", formData.stock_quantity);
      formDataToSend.append("discount_percentage", formData.discount_percentage);

      if (formData.weight) {
        formDataToSend.append("weight", formData.weight);
      }
      formDataToSend.append("shipping_cost", formData.shipping_cost);

      if (tags.length > 0) {
        formDataToSend.append("tags", tags.join(","));
      }

      imageFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const response = await fetch(`${apiUrl}/products`, {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Listing published successfully!");
        navigate("/market");
      } else {
        toast.error(data.message || "Failed to publish listing");
      }
    } catch (error) {
      console.error("Error posting product:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = categories.find((cat) => cat.value === formData.category);
  const subcategoryOptions = selectedCat?.subcategories || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800">
              Seller Studio
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight italic">
              Publish Your <span className="text-blue-600">Listings</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ready to reach thousands of potential buyers? Fill in the details
              to get your items noticed today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-12">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-2 space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold italic">Item Specifications</h2>
                </div>

                <Card className="border-0 shadow-elegant rounded-3xl overflow-hidden p-2">
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="title" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Title *</Label>
                      <Input
                        id="title"
                        placeholder="What are you selling?"
                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 font-medium"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide all essential details about your item..."
                        className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 resize-none italic"
                        rows={8}
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Category *</Label>
                        <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                            <SelectItem value={CUSTOM_OPTION_VALUE}>Other Category</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Location *</Label>
                        <Select value={formData.location} onValueChange={(val) => handleInputChange("location", val)}>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium">
                            <SelectValue placeholder="Select Town" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {locations.map((loc) => (
                              <SelectItem key={loc.toLowerCase()} value={loc.toLowerCase()}>{loc}</SelectItem>
                            ))}
                            <SelectItem value={CUSTOM_OPTION_VALUE}>Other Location</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold italic">Pricing & Inventory</h2>
                </div>
                <Card className="border-0 shadow-elegant rounded-3xl overflow-hidden p-2">
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="price" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Price (KSh) *</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">KES</span>
                          <Input
                            id="price"
                            type="number"
                            className="h-14 pl-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-black text-lg font-mono"
                            placeholder="0"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Condition *</Label>
                        <Select value={formData.condition} onValueChange={(val) => handleInputChange("condition", val)}>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {conditions.map((cond) => (
                              <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Quantity</Label>
                        <Input
                          type="number"
                          className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                          value={formData.stock_quantity}
                          onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Shipping (KSh)</Label>
                        <Input
                          type="number"
                          className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                          value={formData.shipping_cost}
                          onChange={(e) => handleInputChange("shipping_cost", e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Discount %</Label>
                        <Input
                          type="number"
                          className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                          value={formData.discount_percentage}
                          onChange={(e) => handleInputChange("discount_percentage", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column: Media & Actions */}
            <div className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold italic">Visual Assets</h2>
                </div>
                <Card className="border-0 shadow-elegant rounded-3xl overflow-hidden p-6 bg-white dark:bg-slate-950">
                  <div
                    className="group relative flex flex-col items-center justify-center h-56 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-blue-500 hover:bg-blue-50/10 transition-all cursor-pointer overflow-hidden"
                    onClick={() => document.getElementById("images-input")?.click()}
                  >
                    <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <CloudUpload className="h-8 w-8 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="mt-4 font-bold text-sm">Drop images or click to browse</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (Max 5MB)</span>
                    <input
                      id="images-input"
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      {imagePreviews.map((prev, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                          <img src={prev} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 hover:scale-110 group-hover:opacity-100 transition-all"
                            onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </section>

              <section className="space-y-6 sticky top-24">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Tag className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold italic">Finalize</h2>
                </div>
                <Card className="border-0 shadow-elegant rounded-3xl overflow-hidden bg-white dark:bg-slate-950 p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">
                      <CheckCircle2 className="h-4 w-4" />
                      Listing Guard
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      Your listing will be verified by our safety team. Ensure all details are accurate
                      to avoid delays in publishing.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {loading ? "Publishing..." : "Launch Listing"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate("/market")}
                      className="w-full h-14 rounded-2xl font-bold text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Cancel & Discard
                    </Button>
                  </div>
                </Card>
              </section>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostAd;
