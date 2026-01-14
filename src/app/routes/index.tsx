/**
 * Application Routes Configuration
 */

import { NotFoundState } from "@/shared/components/feedback/EmptyStates";
import { FullPageLoader } from "@/shared/components/feedback/LoadingStates";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

// Lazy load pages for code splitting
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Account = lazy(() => import("@/pages/Account"));
const PostAd = lazy(() => import("@/pages/PostAd"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Sell = lazy(() => import("@/pages/Sell"));
const Search = lazy(() => import("@/pages/Search"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader text="Loading page..." />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/account" element={<Account />} />
        <Route path="/post-ad" element={<PostAd />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/search" element={<Search />} />
        <Route path="/category/:category" element={<CategoryPage />} />

        {/* 404 Catch-all route - must be last */}
        <Route
          path="*"
          element={
            <NotFoundState onGoHome={() => (window.location.href = "/")} />
          }
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
