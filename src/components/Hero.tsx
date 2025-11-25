import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Smartphone, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[600px] bg-gradient-to-br from-blue-50 via-background to-green-50 overflow-hidden">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Your Ultimate{" "}
                <span className="bg-gradient-to-r from-blue-600 via-red-500 to-green-600 bg-clip-text text-transparent">
                  Digital Marketplace
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Discover housing, transportation, shopping, healthcare, jobs,
                education, and entertainment—all in one powerful platform
                designed for Kenya.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white"
                onClick={() => navigate("/market")}>
                Start Exploring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/post-ad")}>
                Become a Seller
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Mobile First</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimized for all devices
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    M-Pesa & Card supported
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    Personalized recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-green-200/30 rounded-3xl blur-3xl"></div>
            <img
              src="/images/market.jpg"
              alt="Modern marketplace"
              className="relative z-10 w-full h-auto rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
