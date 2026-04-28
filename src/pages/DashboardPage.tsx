import { useState, useEffect } from 'react';
import { DollarSign, Users, ShoppingBag, Package, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { getOrders, getUsers } from '../services/api';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

// Mock data for charts (replace with real API data)
const revenueData = [
  { month: 'Jan', revenue: 12400 }, { month: 'Feb', revenue: 18200 },
  { month: 'Mar', revenue: 22800 }, { month: 'Apr', revenue: 19600 },
  { month: 'May', revenue: 28400 }, { month: 'Jun', revenue: 34200 },
  { month: 'Jul', revenue: 31800 },
];

const ordersByStatus = [
  { name: 'Placed', value: 35 }, { name: 'Processing', value: 25 },
  { name: 'Shipped', value: 20 }, { name: 'Delivered', value: 15 },
  { name: 'Cancelled', value: 5 },
];

const dailyOrders = [
  { day: 'Mon', orders: 12 }, { day: 'Tue', orders: 19 }, { day: 'Wed', orders: 15 },
  { day: 'Thu', orders: 22 }, { day: 'Fri', orders: 28 }, { day: 'Sat', orders: 35 },
  { day: 'Sun', orders: 18 },
];

interface StatCardProps {
  title: string; value: string; change: string; positive: boolean;
  icon: React.ReactNode; color: string;
}

function StatCard({ title, value, change, positive, icon, color }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <div className={`flex items-center gap-1 text-sm font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUsers().catch(() => ({ data: { users: [], total: 0 } })),
      getOrders().catch(() => ({ data: { orders: [], total: 0 } })),
    ]).then(([usersRes, ordersRes]) => {
      const users = usersRes.data.users || [];
      const orders = ordersRes.data.orders || [];
      const revenue = orders.reduce((sum: number, o: any) => sum + (o.price || 0), 0);
      setStats({ users: users.length, orders: orders.length, revenue });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    });
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      placed: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
      shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red',
    };
    return map[s] || 'badge-gray';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${(stats.revenue / 100).toLocaleString()}`} change="+12.5%" positive icon={<DollarSign className="w-6 h-6 text-green-600" />} color="bg-green-50" />
        <StatCard title="Total Orders" value={stats.orders.toString()} change="+8.2%" positive icon={<ShoppingBag className="w-6 h-6 text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Customers" value={stats.users.toString()} change="+15.3%" positive icon={<Users className="w-6 h-6 text-purple-600" />} color="bg-purple-50" />
        <StatCard title="Products" value="6" change="0%" positive icon={<Package className="w-6 h-6 text-amber-600" />} color="bg-amber-50" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {ordersByStatus.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-gray-600">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Orders Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Orders (This Week)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <a href="/orders" className="text-sm text-primary-600 flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 && <p className="text-sm text-gray-400">No orders yet</p>}
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{order.id?.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{order.tshirt_color} {order.tshirt_type}</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${statusBadge(order.status)}`}>{order.status}</span>
                  <p className="text-xs text-gray-500 mt-1">₹{((order.price || 0) / 100).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
