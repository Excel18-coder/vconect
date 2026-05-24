import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import ProductBrowser from '@/components/ProductBrowser';
import SEO from '@/shared/components/seo/SEO';
import FloatingActionButton from '@/shared/components/ui/FloatingActionButton';

const Index = () => {
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Recent Listings</h2>
                <p className="text-muted-foreground mt-1">Discover what's new in the marketplace</p>
              </div>
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
