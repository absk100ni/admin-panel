import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, ShoppingBag, Loader2 } from 'lucide-react';
import { getRevenueData, getDashboardStats } from '../services/api';

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRevenueData(period).catch(() => ({ data: { daily: [] } })),
      getDashboardStats().catch(() => ({ data: {} })),
    ]).then(([revRes, statsRes]) => {
      const daily = revRes.data.daily || revRes.data.data || revRes.data || [];
      setRevenueData(Array.isArray(daily) ? daily : []);
      setStats(statsRes.data);
      setLoading(false);
    });
  }, [period]);

  const totalRevenue = revenueData.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalOrders = revenueData.reduce((s, d) => s + (d.orders || d.order_count || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const formatMoney = (v: number) => `₹${(v / 100).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Revenue & Analytics</h1>
        <div className="flex gap-1">
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <span className="text-sm text-gray-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-blue-600" /></div>
            <span className="text-sm text-gray-500">Total Orders</span>
          </div>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><CreditCard className="w-5 h-5 text-purple-600" /></div>
            <span className="text-sm text-gray-500">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(avgOrderValue)}</p>
        </div>
        {stats?.cod_outstanding != null && (
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              <span className="text-sm text-gray-500">COD Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatMoney(stats.cod_outstanding)}</p>
          </div>
        )}
        {stats?.cod_outstanding == null && (
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              <span className="text-sm text-gray-500">Growth</span>
            </div>
            <p className="text-2xl font-bold text-green-600">+{revenueData.length > 1 ? Math.round(((revenueData[revenueData.length - 1]?.revenue || 0) / (revenueData[0]?.revenue || 1) - 1) * 100) : 0}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Revenue Line Chart */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => v?.slice(5) || v} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v/100).toLocaleString()}`} />
                <Tooltip formatter={(v: number) => [formatMoney(v), 'Revenue']} labelFormatter={(l) => `Date: ${l}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No revenue data available</div>
          )}
        </div>

        {/* Daily Orders Bar Chart */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Orders</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => v?.slice(5) || v} />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip formatter={(v: number) => [v, 'Orders']} labelFormatter={(l) => `Date: ${l}`} />
                <Bar dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                {!revenueData[0]?.orders && <Bar dataKey="order_count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No order data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
