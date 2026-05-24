import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Car, Home, PlayCircle, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    id: "housing",
    title: "Real Estate",
    description: "Explore premium properties and rental listings across Kenya's key cities.",
    icon: Home,
    image: "/images/house.jpg",
    color: "from-blue-600/20 to-blue-700/20",
    iconColor: "text-blue-600",
    features: ["Verified Listings", "Property Tours", "Expert Agents"],
  },
  {
    id: "transport",
    title: "Transport",
    description: "Reliable transportation solutions, from logistics to private vehicle sales.",
    icon: Car,
    image: "/images/transport.jpg",
    color: "from-emerald-600/20 to-emerald-700/20",
    iconColor: "text-emerald-600",
    features: ["Fleet Services", "Vehicle Sales", "Logistics Help"],
  },
  {
    id: "market",
    title: "Marketplace",
    description: "A diverse hub for high-quality electronics, fashion, and daily essentials.",
    icon: ShoppingBag,
    image: "/images/market2.jpg",
    color: "from-indigo-600/20 to-indigo-700/20",
    iconColor: "text-indigo-600",
    features: ["Top Vendors", "Secure Payments", "Buyer Protection"],
  },
  {
    id: "entertainment",
    title: "Entertainment",
    description: "Discover local events, ticket bookings, and vibrant community content.",
    icon: PlayCircle,
    image: "/images/entertainment.jpg",
    color: "from-violet-600/20 to-violet-700/20",
    iconColor: "text-violet-600",
    features: ["Event Tickets", "Live Shows", "Creative Hub"],
  },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Curated <span className="text-blue-600">Categories</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find exactly what you need with our specialized marketplace sectors tailored for the Kenyan market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <Card
              key={category.id}
              className={`group overflow-hidden border-0 bg-white dark:bg-slate-950 shadow-elegant hover:shadow-hover transition-all duration-500 animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-0">
                <div className="relative h-56 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-300`}></div>
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <div className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 z-20 text-white">
                    <h3 className="text-xl font-bold">{category.title}</h3>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed h-12 overflow-hidden italic">
                    "{category.description}"
                  </p>

                  <div className="space-y-3">
                    {category.features.map((feature, fIndex) => (
                      <div
                        key={fIndex}
                        className="flex items-center text-sm font-medium">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-11 border-blue-100 dark:border-blue-900 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all rounded-xl font-semibold"
                    onClick={() => navigate(`/category/${category.id}`)}>
                    Explore Section
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
