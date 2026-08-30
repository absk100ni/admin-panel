import { useState, useEffect } from 'react';
import { DollarSign, Users, ShoppingBag, Package, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { getDashboardStats, getRevenueData, getOrders } from '../services/api';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

interface StatCardProps {
  title: string; value: string; icon: React.ReactNode; color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ total_users: 0, total_orders: 0, total_revenue: 0, total_products: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardStats().catch(() => ({ data: {} })),
      getRevenueData().catch(() => ({ data: {} })),
      getOrders({ limit: 5 }).catch(() => ({ data: { orders: [] } })),
    ]).then(([statsRes, revenueRes, ordersRes]) => {
      // Stats from /admin/stats
      const s = statsRes.data || {};
      setStats({
        total_users: s.total_users || 0,
        total_orders: s.total_orders || 0,
        total_revenue: s.total_revenue || 0,
        total_products: s.total_products || 0,
      });

      // Revenue analytics from /admin/analytics/revenue
      const rev = revenueRes.data || {};
      if (rev.daily_revenue?.length) {
        setRevenueData(rev.daily_revenue.map((d: any) => ({
          date: d.date?.slice(5) || d.date, // show MM-DD
          revenue: (d.revenue || 0) / 100, // paise to rupees for chart
        })));
      }
      if (rev.status_breakdown) {
        const sb = Object.entries(rev.status_breakdown).map(([name, value]) => ({
          name, value: value as number,
        }));
        setStatusBreakdown(sb);
      }
      if (rev.top_products?.length) {
        setTopProducts(rev.top_products);
      }

      // Recent orders
      setRecentOrders(ordersRes.data.orders?.slice(0, 5) || []);
      setLoading(false);
    });
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      placed: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
      shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red',
      pending_payment: 'badge-yellow', expired: 'badge-red',
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

      {/* KPI Cards — real data from /admin/stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${(stats.total_revenue / 100).toLocaleString('en-IN')}`} icon={<DollarSign className="w-6 h-6 text-green-600" />} color="bg-green-50" />
        <StatCard title="Total Orders" value={stats.total_orders.toString()} icon={<ShoppingBag className="w-6 h-6 text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Customers" value={stats.total_users.toString()} icon={<Users className="w-6 h-6 text-purple-600" />} color="bg-purple-50" />
        <StatCard title="Products" value={stats.total_products.toString()} icon={<Package className="w-6 h-6 text-amber-600" />} color="bg-amber-50" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart — real data from /admin/analytics/revenue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue (Last 30 Days)</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              {loading ? 'Loading revenue data...' : 'No revenue data yet — orders will appear here once paid'}
            </div>
          )}
        </div>

        {/* Order Status Pie — real data from /admin/analytics/revenue status_breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
          {statusBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {statusBreakdown.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 capitalize">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              {loading ? 'Loading...' : 'No orders yet'}
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products bar chart — real data from /admin/analytics/revenue */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Top Products by Quantity Sold</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="quantity" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              {loading ? 'Loading...' : 'No sales data yet — top products will appear once orders are paid'}
            </div>
          )}
        </div>

        {/* Recent Orders — real data */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <a href="/orders" className="text-sm text-primary-600 flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 && <p className="text-sm text-gray-400">{loading ? 'Loading...' : 'No orders yet'}</p>}
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{order.id?.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{order.items?.[0]?.name || order.shipping_address?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${statusBadge(order.status)}`}>{order.status}</span>
                  <p className="text-xs text-gray-500 mt-1">₹{((order.total || order.price || 0) / 100).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
