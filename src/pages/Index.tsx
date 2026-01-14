import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProductBrowser from '@/components/ProductBrowser';
import EnhancedCategoryGrid from '@/shared/components/ui/EnhancedCategoryGrid';
import EnhancedHero from '@/shared/components/ui/EnhancedHero';
import FloatingActionButton from '@/shared/components/ui/FloatingActionButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main>
        <EnhancedHero />
        <EnhancedCategoryGrid />
        <div className="container mx-auto px-4 py-8">
          <ProductBrowser />
        </div>
      </main>
      <Footer />
      <FloatingActionButton />
    </div>
  );
};

export default Index;
