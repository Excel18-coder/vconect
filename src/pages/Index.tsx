import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import ProductBrowser from '@/components/ProductBrowser';
import SEO from '@/shared/components/seo/SEO';
import FloatingActionButton from '@/shared/components/ui/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  return (
    <>
      <SEO
        title="VCONECT - Kenya's Leading Digital Marketplace"
        description="The ultimate digital marketplace for Kenya. Find housing, transport, marketplace goods, and entertainment all in one place."
        keywords="Kenya marketplace, VCONECT, buy sell Kenya, homes Kenya, transport Kenya"
        url="https://vconect.co.ke"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <CategoryGrid />
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-fade-in">
              <div className="space-y-3">
                <div className="h-1 w-12 bg-accent rounded-full"></div>
                <h2 className="text-4xl font-black tracking-tighter text-primary dark:text-white uppercase italic">
                  Premium <span className="text-accent underline decoration-4 decoration-accent/20">Inventory</span>
                </h2>
                <p className="text-slate-500 font-medium">Global standards. Local accessibility. Discover the region's most exclusive assets.</p>
              </div>
              <Button
                variant="outline"
                className="text-[10px] font-black uppercase tracking-[0.2em] px-6 h-10 border-2 rounded-sm border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                onClick={() => navigate('/search')}
              >
                Inspect All Assets
              </Button>
            </div>
            <ProductBrowser />
          </div>
        </main>
        <Footer />
        <FloatingActionButton />
      </div>
    </>
  );
};

export default Index;
