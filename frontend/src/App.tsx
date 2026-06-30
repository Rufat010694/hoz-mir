import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

// Layouts
import SellerLayout from "@/components/layout/SellerLayout";
import CatalogLayout from "@/components/layout/CatalogLayout";

// Seller pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/seller/DashboardPage";
import ProductsPage from "@/pages/seller/ProductsPage";
import OrdersPage from "@/pages/seller/OrdersPage";
import ClientsPage from "@/pages/seller/ClientsPage";
import ReportsPage from "@/pages/seller/ReportsPage";
import SettingsPage from "@/pages/seller/SettingsPage";
import CatalogSharePage from "@/pages/seller/CatalogSharePage";
import CategoriesPage from "@/pages/seller/CategoriesPage";

// Catalog pages
import CatalogPage from "@/pages/catalog/CatalogPage";
import ProductPage from "@/pages/catalog/ProductPage";
import CartPage from "@/pages/catalog/CartPage";
import CheckoutPage from "@/pages/catalog/CheckoutPage";
import TrackPage from "@/pages/catalog/TrackPage";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Only show error toast if we already have data (background refetch failed)
      if (query.state.data !== undefined) {
        const msg = error?.response?.data?.detail || error?.message || "Ошибка загрузки данных";
        toast.error(msg);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any, _vars, _ctx, mutation) => {
      // Show toast only if mutation doesn't define its own onError
      if (!mutation.options.onError) {
        const msg = error?.response?.data?.detail || error?.message || "Ошибка выполнения операции";
        toast.error(msg);
      }
    },
  }),
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { loadUser } = useAuthStore();
  useEffect(() => { loadUser(); }, []);
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Seller panel (protected) */}
            <Route path="/seller" element={<PrivateRoute><SellerLayout /></PrivateRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="catalog-share" element={<CatalogSharePage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Public catalog */}
            <Route path="/catalog/:slug" element={<CatalogLayout />}>
              <Route index element={<CatalogPage />} />
              <Route path="product/:productId" element={<ProductPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="track" element={<TrackPage />} />
            </Route>

            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/seller" replace />} />
            <Route path="*" element={<Navigate to="/seller" replace />} />
          </Routes>
        </AppInit>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </QueryClientProvider>
  );
}
