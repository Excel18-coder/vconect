import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Smartphone, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[1000px] h-[1000px] bg-slate-100 dark:bg-slate-900/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[800px] h-[800px] bg-accent/5 dark:bg-emerald-900/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Content */}
          <div className="space-y-12 animate-slide-up">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-1.5 rounded-sm bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-[10px] font-black uppercase tracking-[0.3em]">
                Elite Marketplace Protocol
              </div>

              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-primary dark:text-white uppercase italic">
                Acquire. <br />
                Liquidate. <br />
                <span className="text-accent underline decoration-8 decoration-accent/20">Dominate.</span>
              </h1>

              <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
                The definitive platform for high-value transactions. Experience unparalleled
                efficiency in real estate, logistics, and premium assets across the region.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Button
                size="lg"
                className="h-14 px-10 bg-primary hover:bg-primary/90 text-white shadow-premium rounded-sm font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
                onClick={() => navigate("/search")}>
                Browse Portfolio
                <ArrowRight className="ml-3 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-10 border-2 border-slate-200 dark:border-slate-800 rounded-sm font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-50 dark:hover:bg-slate-900"
                onClick={() => navigate("/sell")}>
                Partner Access
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-10 pt-12 border-t border-slate-100 dark:border-slate-900 opacity-50">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest">Secured Node</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mobile Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest">High Velocity</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Unit */}
          <div className="hidden lg:block relative animate-fade-in delay-300">
            <div className="relative z-10 bg-white dark:bg-slate-900 p-8 rounded-lg shadow-premium border border-slate-100 dark:border-slate-800 rotate-1">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Market Activity</p>
                    <p className="text-xl font-black italic tracking-tight text-primary dark:text-white uppercase">+24.8% Today</p>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 h-1 w-24 rounded-full overflow-hidden">
                  <div className="bg-accent h-full w-[70%] animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-20 w-full bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center px-4 gap-4">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-900 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-20 w-full bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center px-4 gap-4 opacity-60">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-900 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Vault Value</p>
                  <p className="text-3xl font-black tracking-tighter text-primary dark:text-white italic leading-none">KES 1.2B+</p>
                </div>
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-${i + 1}00 dark:bg-slate-${i + 1}00 shadow-sm animate-pulse`}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Accent Lines */}
            <div className="absolute -top-10 -right-10 w-full h-full border-2 border-accent/20 rounded-lg -z-10 translate-x-4 translate-y-4"></div>
            <div className="absolute top-1/2 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
