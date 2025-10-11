import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Car, 
  ShoppingBag, 
  Heart, 
  Briefcase, 
  GraduationCap, 
  PlayCircle, 
  DollarSign,
  Brain,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const location = useLocation();
  
  const mainCategories = [
    { name: "House", icon: Home, path: "/category/house" },
    { name: "Transport", icon: Car, path: "/category/transport" },
    { name: "Market", icon: ShoppingBag, path: "/category/market" },
    { name: "Health", icon: Heart, path: "/category/health" },
    { name: "Jobs", icon: Briefcase, path: "/category/jobs" },
  ];

  const moreCategories = [
    { name: "Education", icon: GraduationCap, path: "/category/education" },
    { name: "Entertainment", icon: PlayCircle, path: "/category/entertainment" },
    { name: "Revenue", icon: DollarSign, path: "/category/revenue" },
    { name: "AI Insights", icon: Brain, path: "/category/algorithm" },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-1">
            {mainCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.path}
                  variant={location.pathname === category.path ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                  asChild
                >
                  <Link to={category.path}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </Link>
                </Button>
              );
            })}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <span className="hidden sm:inline">More</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <DropdownMenuItem key={category.path} asChild>
                      <Link 
                        to={category.path} 
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{category.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/sell">Sell</Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-primary to-pink-500" asChild>
              <Link to="/post-ad">Post Ad</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;