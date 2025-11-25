import { Button } from "@/components/ui/button";
import { Brain, Car, Home, PlayCircle, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const mainCategories = [
    { name: "House", icon: Home, path: "/category/house" },
    { name: "Transport", icon: Car, path: "/category/transport" },
    { name: "Market", icon: ShoppingBag, path: "/category/market" },
    {
      name: "Entertainment",
      icon: PlayCircle,
      path: "/category/entertainment",
    },
    { name: "AI Insights", icon: Brain, path: "/ai-insights" },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {mainCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.path}
                  variant={
                    location.pathname === category.path ? "default" : "ghost"
                  }
                  size="sm"
                  className="flex items-center space-x-2 whitespace-nowrap"
                  asChild>
                  <Link to={category.path}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/sell">Sell</Link>
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-primary to-pink-500"
              asChild>
              <Link to="/post-ad">Post Ad</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
