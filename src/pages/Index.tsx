import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductBrowser from "@/components/ProductBrowser";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main>
        <Hero />
        <CategoryGrid />
        <div className="container mx-auto px-4 py-8">
          <ProductBrowser />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
