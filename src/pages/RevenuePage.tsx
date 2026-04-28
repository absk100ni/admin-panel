import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, CreditCard, ShoppingBag } from 'lucide-react';

const monthlyRevenue = [
  { month: 'Jan', revenue: 24500, orders: 49 }, { month: 'Feb', revenue: 38200, orders: 76 },
  { month: 'Mar', revenue: 52800, orders: 105 }, { month: 'Apr', revenue: 41600, orders: 83 },
  { month: 'May', revenue: 58400, orders: 116 }, { month: 'Jun', revenue: 72200, orders: 144 },
  { month: 'Jul', revenue: 65800, orders: 131 },
];

const paymentMethods = [
  { method: 'UPI', amount: 185000, count: 370 }, { method: 'Cards', amount: 92000, count: 184 },
  { method: 'COD', amount: 45000, count: 90 }, { method: 'Wallet', amount: 28000, count: 56 },
];

export default function RevenuePage() {
  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = monthlyRevenue.reduce((s, m) => s + m.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Revenue & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div><span className="text-sm text-gray-500">Total Revenue</span></div>
          <p className="text-2xl font-bold">₹{(totalRevenue / 100).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-blue-600" /></div><span className="text-sm text-gray-500">Total Orders</span></div>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><CreditCard className="w-5 h-5 text-purple-600" /></div><span className="text-sm text-gray-500">Avg Order Value</span></div>
          <p className="text-2xl font-bold">₹{avgOrderValue}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div><span className="text-sm text-gray-500">Growth</span></div>
          <p className="text-2xl font-bold text-green-600">+23.5%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenue}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
              <Tooltip /><Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
              <Tooltip /><Line type="monotone" dataKey="orders" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={paymentMethods}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="method" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
            <Tooltip /><Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
