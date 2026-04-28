import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrders, updateOrderStatus } from '../services/api';

const statusOptions = ['all', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const badgeMap: Record<string, string> = {
  placed: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getOrders(filter === 'all' ? undefined : filter)
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateOrderStatus(id, status);
      toast.success('Status updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  const filtered = orders.filter(o =>
    !search || o.id?.includes(search) || o.shipping_address?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search orders..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {statusOptions.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">Order ID</th>
              <th className="table-header">Customer</th>
              <th className="table-header">Product</th>
              <th className="table-header">Amount</th>
              <th className="table-header">Status</th>
              <th className="table-header">Payment</th>
              <th className="table-header">Date</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">#{o.id?.slice(0, 8)}</td>
                <td className="table-cell">{o.shipping_address?.name || 'N/A'}<br/><span className="text-xs text-gray-400">{o.shipping_address?.city}</span></td>
                <td className="table-cell">{o.tshirt_color} {o.tshirt_type}<br/><span className="text-xs text-gray-400">Size: {o.size}</span></td>
                <td className="table-cell font-medium">₹{((o.price || 0) / 100).toFixed(0)}</td>
                <td className="table-cell"><span className={`badge ${badgeMap[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                <td className="table-cell"><span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{o.payment_status}</span></td>
                <td className="table-cell text-xs">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : ''}</td>
                <td className="table-cell">
                  <select value={o.status} onChange={e => handleStatusChange(o.id, e.target.value)}
                    className="text-xs border rounded px-2 py-1">
                    {statusOptions.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">No orders found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
