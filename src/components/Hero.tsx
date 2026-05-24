import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Smartphone, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[700px] flex items-center overflow-hidden bg-white dark:bg-slate-950">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-10 animate-slide-up">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Kenya's #1 Digital Marketplace
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Connect. Trade.{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Succeed.
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                Experience the safest and most efficient way to buy, sell, and discover
                services across Kenya. From housing to transport, we've got you covered.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none transition-all hover:scale-105"
                onClick={() => navigate("/market")}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 border-2 transition-all hover:bg-secondary"
                onClick={() => navigate("/post-ad")}>
                Become a Seller
              </Button>
            </div>

            {/* Features Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Mobile First</h3>
                  <p className="text-xs text-muted-foreground">Seamless experience</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Secure Trade</h3>
                  <p className="text-xs text-muted-foreground">Verified listings</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Fast Growth</h3>
                  <p className="text-xs text-muted-foreground">Unlimited reach</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image Section */}
          <div className="relative animate-scale-in">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 blur-3xl rounded-[3rem]"></div>
            <div className="relative glass p-4 rounded-[2.5rem] shadow-elegant overflow-hidden">
              <img
                src="/images/market.jpg"
                alt="VCONECT Platform"
                className="w-full h-auto rounded-[2rem] shadow-2xl object-cover aspect-[4/3] transform hover:scale-105 transition-transform duration-700"
              />
              {/* Floating Stat Card */}
              <div className="absolute bottom-10 left-10 glass-border bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl shadow-xl animate-bounce">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Active Sellers</div>
                    <div className="text-lg font-bold">12,000+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
