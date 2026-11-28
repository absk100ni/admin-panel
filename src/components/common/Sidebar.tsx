import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, Package, TrendingUp, Settings, LogOut, Store, Tag, Ticket, FolderTree, RotateCcw, MessageSquare, Star, Activity, ToggleLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Tag, label: 'Products' },
  { path: '/categories', icon: FolderTree, label: 'Categories' },
  { path: '/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/returns', icon: RotateCcw, label: 'Returns' },
  { path: '/reviews', icon: Star, label: 'Reviews' },
  { path: '/coupons', icon: Ticket, label: 'Coupons' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/users', icon: Users, label: 'Customers' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/revenue', icon: TrendingUp, label: 'Revenue' },
  { path: '/operations', icon: Activity, label: 'Operations' },
  { path: '/feature-flags', icon: ToggleLeft, label: 'Feature Flags' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const admin = useAuthStore((s) => s.admin);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-sidebar-bg min-h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">{import.meta.env.VITE_STORE_NAME || 'LucubraElec'}</h1>
            <p className="text-gray-400 text-[10px]">{admin?.name || 'Admin Panel'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white w-full transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
