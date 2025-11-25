import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  ImagePlus,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  condition: string;
  location: string;
  images: string[];
  tags: string[];
  status: "active" | "sold" | "inactive";
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  subcategory: string;
  condition: string;
  location: string;
  tags: string;
  images: File[];
}

const ProductManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    condition: "",
    location: "",
    tags: "",
    images: [],
  });

  const categories = {
    house: ["Apartments", "Houses", "Commercial", "Land", "Vacation Rentals"],
    transport: ["Cars", "Motorcycles", "Buses", "Trucks", "Spare Parts"],
    market: ["Electronics", "Fashion", "Home & Garden", "Sports", "Books"],
    entertainment: ["Events", "Music", "Movies", "Gaming", "Content Creation"],
  };

  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${apiUrl}/products/seller/my-products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched products:", data.data?.products); // Debug log
        setProducts(data.data?.products || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 8), // Max 8 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "",
      subcategory: "",
      condition: "",
      location: "",
      tags: "",
      images: [],
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.category ||
      !formData.subcategory ||
      !formData.condition ||
      !formData.location
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("subcategory", formData.subcategory);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("tags", formData.tags);

      // Add new images if any
      if (formData.images.length > 0) {
        formData.images.forEach((image) => {
          formDataToSend.append("images", image);
        });
      }

      const url = editingProduct
        ? `${apiUrl}/products/${editingProduct.id}`
        : `${apiUrl}/products`;

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, browser will set it with boundary for FormData
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          editingProduct
            ? "Product updated successfully! Changes are now live."
            : "Product created successfully! It's now visible to buyers."
        );
        setIsDialogOpen(false);
        resetForm();
        // Refresh the product list to show updates
        await fetchProducts();
      } else {
        toast.error(result.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (
    productId: string,
    productTitle: string,
    hasImages: boolean
  ) => {
    const imageText = hasImages
      ? " All associated images will also be removed from storage."
      : "";
    const confirmed = window.confirm(
      `Are you sure you want to delete "${productTitle}"?\n\n` +
        `This will:\n` +
        `• Remove the product from your listings\n` +
        `• Hide it from all buyers\n` +
        `• Delete all product images from Cloudinary${imageText}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${apiUrl}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Product and all images deleted successfully!", {
          description:
            "The product has been removed from your listings and storage.",
        });
        // Refresh the product list
        await fetchProducts();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      subcategory: product.subcategory,
      condition: product.condition,
      location: product.location,
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      images: [], // Start with empty, user can add new images
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Products</h2>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Update your product information"
                  : "Create a new product listing"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Product title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: value,
                        subcategory: "",
                      }))
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">Real Estate</SelectItem>
                      <SelectItem value="transport">Transportation</SelectItem>
                      <SelectItem value="market">Marketplace</SelectItem>
                      <SelectItem value="health">Healthcare</SelectItem>
                      <SelectItem value="jobs">Jobs</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="entertainment">
                        Entertainment
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory *</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, subcategory: value }))
                    }
                    disabled={!formData.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category &&
                        categories[
                          formData.category as keyof typeof categories
                        ]?.map((sub) => (
                          <SelectItem key={sub} value={sub.toLowerCase()}>
                            {sub}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Product description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (KSh) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, condition: value }))
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Brand New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Enter your location (e.g., Nairobi, Westlands)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the specific location where the item is available
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder="comma, separated, tags"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Images (max 8)</Label>
                <div className="space-y-3">
                  {/* Show existing images when editing */}
                  {editingProduct &&
                    editingProduct.images &&
                    editingProduct.images.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Current Images:
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {editingProduct.images.map((imageUrl, index) => (
                            <div key={`existing-${index}`} className="relative">
                              <img
                                src={imageUrl}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <Badge
                                className="absolute bottom-1 right-1 text-xs"
                                variant="secondary">
                                Current
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Uploading new images will add to existing ones
                        </p>
                      </div>
                    )}

                  <div className="flex items-center gap-2">
                    <Label htmlFor="images" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent">
                        <ImagePlus className="h-4 w-4" />
                        {editingProduct ? "Add More Images" : "Choose Images"}
                      </div>
                    </Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {formData.images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        New Images to Upload:
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removeImage(index)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingProduct ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && !isDialogOpen ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by adding your first product to begin selling
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {product.title}
                        </h3>
                        <Badge
                          variant={
                            product.status === "active"
                              ? "default"
                              : product.status === "sold"
                              ? "secondary"
                              : "outline"
                          }>
                          {product.status}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          KSh {product.price.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {product.views} views
                        </span>
                        <span>
                          {product.category} • {product.subcategory}
                        </span>
                      </div>

                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(product.createdAt).toLocaleDateString()}
                        {product.updatedAt !== product.createdAt && (
                          <span>
                            {" "}
                            • Updated:{" "}
                            {new Date(product.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {product.images && product.images.length > 0 && (
                      <div className="ml-4">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-24 h-24 object-cover rounded border"
                        />
                        {product.images.length > 1 && (
                          <div className="text-xs text-center text-muted-foreground mt-1">
                            +{product.images.length - 1} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/product/${product.id}`)}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editProduct(product)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        deleteProduct(
                          product.id,
                          product.title,
                          product.images && product.images.length > 0
                        )
                      }
                      className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProductManager;
