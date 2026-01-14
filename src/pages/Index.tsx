import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProductBrowser from '@/components/ProductBrowser';
import SEO from '@/shared/components/seo/SEO';
import FloatingActionButton from '@/shared/components/ui/FloatingActionButton';

const Index = () => {
  return (
    <>
      <SEO
        title="VCONECT - Buy & Sell in Kenya | Houses, Cars, Electronics & More"
        description="Kenya's #1 marketplace for buying and selling. Find houses, cars, electronics, and more. Post free ads, connect with sellers, and discover amazing deals across Kenya."
        keywords="Kenya marketplace, buy sell Kenya, houses for sale Kenya, cars for sale Kenya, electronics Kenya, classified ads Kenya, online shopping Kenya, Nairobi marketplace, Mombasa marketplace"
        url="https://vconect.com"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <ProductBrowser />
        </main>
        <Footer />
        <FloatingActionButton />
      </div>
    </>
  );
};

export default Index;
