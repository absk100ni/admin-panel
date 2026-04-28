import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/common/Sidebar';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import InventoryPage from './pages/InventoryPage';
import RevenuePage from './pages/RevenuePage';
import ProductsPage from './pages/ProductsPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '14px' } }} />
      <Routes>
        <Route path="/" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
        <Route path="/orders" element={<Layout><OrdersPage /></Layout>} />
        <Route path="/users" element={<Layout><UsersPage /></Layout>} />
        <Route path="/inventory" element={<Layout><InventoryPage /></Layout>} />
        <Route path="/revenue" element={<Layout><RevenuePage /></Layout>} />
        <Route path="/settings" element={<Layout><div className="text-gray-500">Settings page — coming soon</div></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
