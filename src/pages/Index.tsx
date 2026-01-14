import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProductBrowser from '@/components/ProductBrowser';
import FloatingActionButton from '@/shared/components/ui/FloatingActionButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <ProductBrowser />
      </main>
      <Footer />
      <FloatingActionButton />
    </div>
  );
};

export default Index;
