import { Card, CardContent } from "@/components/ui/card";
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
  ArrowRight
} from "lucide-react";

import houseImage from "@/assets/house-section.jpg";
import transportImage from "@/assets/transport-section.jpg";
import marketImage from "@/assets/market-section.jpg";
import healthImage from "@/assets/health-section.jpg";
import jobsImage from "@/assets/jobs-section.jpg";
import educationImage from "@/assets/education-section.jpg";
import entertainmentImage from "@/assets/entertainment-section.jpg";

const categories = [
  {
    id: "house",
    title: "House",
    description: "Find your perfect home. Rent or buy properties across Kenya.",
    icon: Home,
    image: houseImage,
    color: "from-blue-500 to-blue-600",
    features: ["Property Listings", "Virtual Tours", "Map Integration"]
  },
  {
    id: "transport",
    title: "Transport",
    description: "Book tickets and track your journey in real-time.",
    icon: Car,
    image: transportImage,
    color: "from-green-500 to-green-600",
    features: ["Bus Tickets", "GPS Tracking", "Real-time Updates"]
  },
  {
    id: "market",
    title: "Market",
    description: "Shop from thousands of vendors across multiple categories.",
    icon: ShoppingBag,
    image: marketImage,
    color: "from-orange-500 to-orange-600",
    features: ["Multi-vendor", "Reviews & Ratings", "Secure Checkout"]
  },
  {
    id: "health",
    title: "Health",
    description: "Connect with doctors and access healthcare services remotely.",
    icon: Heart,
    image: healthImage,
    color: "from-red-500 to-red-600",
    features: ["Telemedicine", "Online Pharmacy", "Emergency Services"]
  },
  {
    id: "jobs",
    title: "Jobs",
    description: "Find career opportunities or hire talented professionals.",
    icon: Briefcase,
    image: jobsImage,
    color: "from-purple-500 to-purple-600",
    features: ["Job Listings", "CV Builder", "Direct Hiring"]
  },
  {
    id: "education",
    title: "Education",
    description: "Learn new skills with courses from basic to professional levels.",
    icon: GraduationCap,
    image: educationImage,
    color: "from-indigo-500 to-indigo-600",
    features: ["Online Courses", "Certificates", "Live Classes"]
  },
  {
    id: "entertainment",
    title: "Entertainment",
    description: "Create, share, and discover amazing content with the community.",
    icon: PlayCircle,
    image: entertainmentImage,
    color: "from-pink-500 to-pink-600",
    features: ["Content Creation", "Live Streaming", "Monetization"]
  },
  {
    id: "revenue",
    title: "Revenue",
    description: "Track your earnings and optimize your income streams.",
    icon: DollarSign,
    image: null,
    color: "from-yellow-500 to-yellow-600",
    features: ["Earnings Dashboard", "Analytics", "Payment Tracking"]
  },
  {
    id: "algorithm",
    title: "AI Insights",
    description: "Get personalized recommendations powered by advanced AI.",
    icon: Brain,
    image: null,
    color: "from-cyan-500 to-cyan-600",
    features: ["Smart Recommendations", "Predictive Analytics", "User Insights"]
  }
];

const CategoryGrid = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Explore Our <span className="text-primary">Marketplace</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nine powerful sections designed to meet all your digital needs in one unified platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50">
              <CardContent className="p-0">
                <div className="relative">
                  {category.image ? (
                    <div className="relative h-48 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-20`}></div>
                      <img 
                        src={category.image} 
                        alt={category.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className={`h-48 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <category.icon className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4">
                    <div className="p-2 bg-white/90 rounded-lg shadow-lg">
                      <category.icon className="h-6 w-6 text-primary" />
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
                      <div key={index} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="ghost" 
                    className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                    onClick={() => window.location.href = `/${category.id}`}
                  >
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