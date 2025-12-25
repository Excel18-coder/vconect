import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Car, Home, PlayCircle, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Images are now loaded from public/images folder

const categories = [
  {
    id: "housing",
    title: "Housing",
    description: "Find your perfect home. Rent or buy properties across Kenya.",
    icon: Home,
    image: "/images/house.jpg",
    color: "from-blue-500 to-blue-600",
    features: ["Property Listings", "Virtual Tours", "Map Integration"],
  },
  {
    id: "transport",
    title: "Transport",
    description: "Book tickets and track your journey in real-time.",
    icon: Car,
    image: "/images/transport.jpg",
    color: "from-green-500 to-green-600",
    features: ["Bus Tickets", "GPS Tracking", "Real-time Updates"],
  },
  {
    id: "market",
    title: "Market",
    description: "Shop from thousands of vendors across multiple categories.",
    icon: ShoppingBag,
    image: "/images/market2.jpg",
    color: "from-red-500 to-red-600",
    features: ["Multi-vendor", "Reviews & Ratings", "Secure Checkout"],
  },
  {
    id: "entertainment",
    title: "Entertainment",
    description:
      "Create, share, and discover amazing content with the community.",
    icon: PlayCircle,
    image: "/images/entertainment.jpg",
    color: "from-blue-700 to-blue-800",
    features: ["Content Creation", "Live Streaming", "Monetization"],
  },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Explore Our <span className="text-blue-600">Marketplace</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse categories and discover great deals from sellers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50">
              <CardContent className="p-0">
                <div className="relative">
                  {category.image ? (
                    <div className="relative h-48 overflow-hidden">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-20`}></div>
                      <img
                        src={category.image}
                        alt={category.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div
                      className={`h-48 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <category.icon className="h-16 w-16 text-white" />
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <div className="p-2 bg-white/90 rounded-lg shadow-lg">
                      <category.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {category.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {category.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    onClick={() => navigate(`/category/${category.id}`)}>
                    Explore {category.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
