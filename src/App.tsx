import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/common/Sidebar';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const RevenuePage = lazy(() => import('./pages/RevenuePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const CouponsPage = lazy(() => import('./pages/CouponsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const OperationsPage = lazy(() => import('./pages/OperationsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function PageLoading() {
  return <div className="min-h-64 flex items-center justify-center text-sm text-gray-500">Loading…</div>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return <RequireAuth><Layout>{children}</Layout></RequireAuth>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '14px' } }} />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
          <Route path="/" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
          <Route path="/products" element={<ProtectedPage><ProductsPage /></ProtectedPage>} />
          <Route path="/categories" element={<ProtectedPage><CategoriesPage /></ProtectedPage>} />
          <Route path="/orders" element={<ProtectedPage><OrdersPage /></ProtectedPage>} />
          <Route path="/orders/:id" element={<ProtectedPage><OrderDetailPage /></ProtectedPage>} />
          <Route path="/returns" element={<ProtectedPage><ReturnsPage /></ProtectedPage>} />
          <Route path="/reviews" element={<ProtectedPage><ReviewsPage /></ProtectedPage>} />
          <Route path="/messages" element={<ProtectedPage><MessagesPage /></ProtectedPage>} />
          <Route path="/users" element={<ProtectedPage><UsersPage /></ProtectedPage>} />
          <Route path="/inventory" element={<ProtectedPage><InventoryPage /></ProtectedPage>} />
          <Route path="/revenue" element={<ProtectedPage><RevenuePage /></ProtectedPage>} />
          <Route path="/coupons" element={<ProtectedPage><CouponsPage /></ProtectedPage>} />
          <Route path="/operations" element={<ProtectedPage><OperationsPage /></ProtectedPage>} />
          <Route path="/settings" element={<ProtectedPage><div className="text-gray-500">Settings page — coming soon</div></ProtectedPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
