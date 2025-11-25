import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Account from "./pages/Account";
import AIInsights from "./pages/AIInsights";
import Auth from "./pages/Auth";
import CategoryPage from "./pages/CategoryPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PostAd from "./pages/PostAd";
import ProductDetail from "./pages/ProductDetail";
import Revenue from "./pages/Revenue";
import Search from "./pages/Search";
import Sell from "./pages/Sell";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/post-ad" element={<PostAd />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/house" element={<CategoryPage />} />
            <Route path="/transport" element={<CategoryPage />} />
            <Route path="/market" element={<CategoryPage />} />
            <Route path="/education" element={<CategoryPage />} />
            <Route path="/entertainment" element={<CategoryPage />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/category/revenue" element={<Revenue />} />
            <Route path="/category/algorithm" element={<AIInsights />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
