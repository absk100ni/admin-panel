import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/common/Sidebar';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import UsersPage from './pages/UsersPage';
import InventoryPage from './pages/InventoryPage';
import RevenuePage from './pages/RevenuePage';
import ProductsPage from './pages/ProductsPage';
import CouponsPage from './pages/CouponsPage';
import CategoriesPage from './pages/CategoriesPage';
import ReturnsPage from './pages/ReturnsPage';
import MessagesPage from './pages/MessagesPage';
import LoginPage from './pages/LoginPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '14px' } }} />
      <Routes>
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/" element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>} />
        <Route path="/products" element={<RequireAuth><Layout><ProductsPage /></Layout></RequireAuth>} />
        <Route path="/categories" element={<RequireAuth><Layout><CategoriesPage /></Layout></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Layout><OrdersPage /></Layout></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><Layout><OrderDetailPage /></Layout></RequireAuth>} />
        <Route path="/returns" element={<RequireAuth><Layout><ReturnsPage /></Layout></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><Layout><MessagesPage /></Layout></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><Layout><UsersPage /></Layout></RequireAuth>} />
        <Route path="/inventory" element={<RequireAuth><Layout><InventoryPage /></Layout></RequireAuth>} />
        <Route path="/revenue" element={<RequireAuth><Layout><RevenuePage /></Layout></RequireAuth>} />
        <Route path="/coupons" element={<RequireAuth><Layout><CouponsPage /></Layout></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Layout><div className="text-gray-500">Settings page — coming soon</div></Layout></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
