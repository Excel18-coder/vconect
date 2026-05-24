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
    <section className="py-32 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 animate-fade-in">
          <div className="space-y-4">
            <div className="h-1 w-20 bg-accent rounded-full"></div>
            <h2 className="text-5xl lg:text-6xl font-black tracking-tighter text-primary dark:text-white uppercase italic">
              Strategic <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/20">Sectors</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl font-medium leading-relaxed">
              Targeted marketplace domains engineered for high-performance transactions and premium asset discovery.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 p-0 h-auto"
            onClick={() => navigate('/search')}
          >
            Access Full Portfolio <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="group relative cursor-pointer overflow-hidden aspect-[4/5] bg-slate-950 border border-slate-100 dark:border-slate-800 transition-all duration-700"
              onClick={() => navigate(`/category/${category.id}`)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={category.image}
                alt={category.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="mb-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="w-12 h-12 rounded-sm bg-white dark:bg-slate-900 flex items-center justify-center mb-6 shadow-premium">
                    <category.icon className="h-5 w-5 text-primary dark:text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">{category.title}</h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {category.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {category.features.slice(0, 2).map((feature, fIndex) => (
                      <span key={fIndex} className="text-[10px] font-black text-accent uppercase tracking-widest">
                        • {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover Border Overlay */}
              <div className="absolute inset-0 border-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
