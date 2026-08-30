import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Check, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { getReturns, updateReturn } from '../services/api';

const statusTabs = ['requested', 'approved', 'rejected', 'completed'];
const badgeMap: Record<string, string> = {
  requested: 'badge-yellow',
  approved: 'badge-blue',
  rejected: 'badge-red',
  completed: 'badge-green',
};

const formatMoney = (v: number) => `₹${(v / 100).toLocaleString('en-IN')}`;

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [filter, setFilter] = useState('requested');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approvedBanner, setApprovedBanner] = useState<{ id: string; orderId: string } | null>(null);

  const load = () => {
    setLoading(true);
    getReturns(filter)
      .then(r => setReturns(r.data.return_requests || r.data.returns || []))
      .catch(() => toast.error('Failed to load returns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (id: string, status: 'approved' | 'rejected' | 'completed', note?: string) => {
    setSubmitting(true);
    setActionId(id);
    try {
      await updateReturn(id, { status, admin_note: note });
      toast.success(`Return ${status} successfully`);
      if (status === 'approved') {
        const ret = returns.find(r => r.id === id);
        if (ret?.type === 'return') {
          setApprovedBanner({ id, orderId: ret.order_id });
        }
      }
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${status} return`);
    } finally {
      setSubmitting(false);
      setActionId(null);
      setNoteModal(null);
      setAdminNote('');
    }
  };

  const openNoteModal = (id: string, action: 'approved' | 'rejected') => {
    setNoteModal({ id, action });
    setAdminNote('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {approvedBanner && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Return approved. Process refund from the{' '}
            <Link to={`/orders/${approvedBanner.orderId}`} className="font-medium underline hover:text-blue-900">
              order detail page
            </Link>.
          </p>
          <button onClick={() => setApprovedBanner(null)} className="ml-auto text-blue-400 hover:text-blue-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-1 mb-6 flex-wrap">
        {statusTabs.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">Request ID</th>
              <th className="table-header">Order</th>
              <th className="table-header">Customer</th>
              <th className="table-header">Type</th>
              <th className="table-header">Items</th>
              <th className="table-header">Reason</th>
              <th className="table-header">Age</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="table-cell text-center py-8">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                  Loading...
                </div>
              </td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan={9} className="table-cell text-center text-gray-400 py-8">No return requests found</td></tr>
            ) : returns.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">#{r.id?.slice(0, 8)}</td>
                <td className="table-cell">
                  <Link to={`/orders/${r.order_id}`} className="text-primary-600 hover:underline font-mono text-xs">
                    #{r.order_id?.slice(0, 8)}
                  </Link>
                </td>
                <td className="table-cell text-sm">{r.customer_name || r.customer?.name || 'N/A'}</td>
                <td className="table-cell">
                  <span className={`badge ${r.type === 'return' ? 'badge-yellow' : 'badge-purple'}`}>
                    {r.type || 'return'}
                  </span>
                </td>
                <td className="table-cell text-xs text-gray-600 max-w-[200px] truncate">{r.items_summary || r.items?.map((i: any) => i.name).join(', ') || 'N/A'}</td>
                <td className="table-cell text-xs text-gray-600 max-w-[150px] truncate">{r.reason || 'N/A'}</td>
                <td className="table-cell text-xs text-gray-500">
                  {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : 'N/A'}
                </td>
                <td className="table-cell">
                  <span className={`badge ${badgeMap[r.status] || 'badge-gray'}`}>{r.status}</span>
                </td>
                <td className="table-cell">
                  {r.status === 'requested' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openNoteModal(r.id, 'approved')}
                        disabled={submitting && actionId === r.id}
                        className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openNoteModal(r.id, 'rejected')}
                        disabled={submitting && actionId === r.id}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {r.status === 'approved' && (
                    <button
                      onClick={() => handleAction(r.id, 'completed')}
                      disabled={submitting && actionId === r.id}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1 text-xs"
                      title="Mark Completed"
                    >
                      {submitting && actionId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2 capitalize">{noteModal.action === 'approved' ? 'Approve' : 'Reject'} Return</h3>
            <p className="text-sm text-gray-600 mb-4">Add a note (optional):</p>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Admin note..."
              rows={3}
              className="w-full border rounded-lg p-3 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleAction(noteModal.id, noteModal.action, adminNote || undefined)}
                disabled={submitting}
                className={`flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                  noteModal.action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Submitting...' : noteModal.action === 'approved' ? 'Approve' : 'Reject'}
              </button>
              <button onClick={() => { setNoteModal(null); setAdminNote(''); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
