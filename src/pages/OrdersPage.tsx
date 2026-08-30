import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getOrders, updateOrderStatus } from '../services/api';

// P0-3: Legal state machine transitions
const STATE_MACHINE: Record<string, string[]> = {
  pending_payment: ['cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [], // terminal (return flow handled separately)
  cancelled: [], // terminal
  expired: [], // terminal
  refund_pending: ['refunded'],
  refunded: [], // terminal
  returned: [], // terminal
};

// Must mirror backend order state machine (internal/order/state_machine.go)
const allStatuses = [
  'all', 'placed', 'confirmed', 'processing', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled', 'expired',
  'abandoned', 'returned',
];

const badgeMap: Record<string, string> = {
  pending_payment: 'badge-yellow', placed: 'badge-yellow', confirmed: 'badge-blue',
  processing: 'badge-purple', shipped: 'badge-blue', out_for_delivery: 'badge-blue',
  delivered: 'badge-green', cancelled: 'badge-red', expired: 'badge-red',
  refund_pending: 'badge-yellow', refunded: 'badge-green', returned: 'badge-gray',
};

// P0-4: Payment status filter options
// Real backend payment_status values ('failed' is never set on orders)
const paymentStatuses = ['all', 'pending', 'paid', 'refund_pending', 'refunded'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getOrders({
      q: search.trim() || undefined,
      status: filter === 'all' ? undefined : filter,
      payment_status: paymentFilter === 'all' ? undefined : paymentFilter,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, paymentFilter, dateFrom, dateTo]);
  // Debounced server-side search — matches order number, id, customer name/phone across ALL orders
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [search]);

  // P0-3: Status change with error surfacing as toast
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, id: string) => {
    e.stopPropagation();
    try {
      await updateOrderStatus(id, e.target.value);
      toast.success('Status updated');
      load();
    } catch (err: any) {
      // Surface backend 400 errors as toasts instead of silent failure
      const msg = err.response?.data?.error || err.response?.data?.message || 'Update failed';
      toast.error(msg);
    }
  };

  const filtered = orders; // search is server-side now (order number / id / name / phone)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap items-end">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search orders..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* P0-4: Payment status filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
          <select className="border rounded-lg px-3 py-2 text-sm" value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}>
            {paymentStatuses.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Payments' : s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)} />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={dateTo}
            onChange={e => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-red-500 hover:underline">Clear</button>
          )}
        </div>
      </div>

      {/* P0-4: Order status filter tabs including pending_payment and expired */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {allStatuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {s === 'refund_pending' ? 'Refund Pending' : s === 'pending_payment' ? 'Pending Payment' : s === 'out_for_delivery' ? 'Out for Delivery' : s}
          </button>
        ))}
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
            {loading ? (
              <tr><td colSpan={8} className="table-cell text-center py-8">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                  Loading...
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">No orders found</td></tr>
            ) : filtered.map(o => {
              // P0-3: Compute allowed next states for this order
              const allowedTransitions = STATE_MACHINE[o.status] || [];
              return (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                  <td className="table-cell font-mono text-xs">
                    <div className="font-semibold">{o.order_number || `#${o.id?.slice(0, 8)}`}</div>
                    <div className="text-[10px] text-gray-400">#{o.id?.slice(0, 8)}</div>
                  </td>
                  <td className="table-cell">{o.shipping_address?.name || 'N/A'}{o.is_guest && <span className="ml-1.5 px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-semibold align-middle">GUEST</span>}<br/><span className="text-xs text-gray-400">{o.shipping_address?.city}</span></td>
                  <td className="table-cell">{o.items?.[0]?.name || 'N/A'}{(o.items?.length || 0) > 1 && <span className="text-xs text-gray-400"> +{o.items.length - 1} more</span>}</td>
                  <td className="table-cell font-medium">₹{((o.total || o.price || 0) / 100).toLocaleString('en-IN')}</td>
                  <td className="table-cell"><span className={`badge ${badgeMap[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                  <td className="table-cell">
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{o.payment_status === 'paid' && (o.cod_amount || 0) > 0 && !o.cod_collected ? 'paid · COD due' : (o.payment_status || 'pending')}</span>
                    {o.payment_plan === 'partial' && <span className="text-[10px] text-gray-400 block">Partial</span>}
                  </td>
                  <td className="table-cell text-xs">{o.created_at ? format(new Date(o.created_at), 'dd MMM yyyy') : ''}</td>
                  <td className="table-cell" onClick={e => e.stopPropagation()}>
                    {allowedTransitions.length > 0 ? (
                      <select value={o.status} onChange={e => handleStatusChange(e, o.id)}
                        className="text-xs border rounded px-2 py-1">
                        <option value={o.status} disabled>{o.status}</option>
                        {allowedTransitions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Terminal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
