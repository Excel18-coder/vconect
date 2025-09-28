import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main>
        <Hero />
        <CategoryGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
