import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getContactMessages, updateContactMessage } from '../services/api';

const statusTabs = ['open', 'resolved'];

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getContactMessages(filter)
      .then(r => setMessages(r.data.contact_messages || r.data.messages || []))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await updateContactMessage(id, { status: 'resolved' });
      toast.success('Message marked as resolved');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resolve message');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-1 mb-6">
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
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Subject</th>
              <th className="table-header">Message</th>
              <th className="table-header">Received</th>
              <th className="table-header">Status</th>
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
            ) : messages.length === 0 ? (
              <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">No messages found</td></tr>
            ) : messages.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="table-cell text-sm font-medium">{m.name || 'N/A'}</td>
                <td className="table-cell text-xs text-gray-600">{m.email || 'N/A'}</td>
                <td className="table-cell text-xs text-gray-600">{m.phone || '—'}</td>
                <td className="table-cell text-sm">{m.subject || 'No subject'}</td>
                <td className="table-cell max-w-[250px]">
                  <div className="flex items-start gap-1">
                    <p className={`text-xs text-gray-600 ${expandedId === m.id ? '' : 'line-clamp-2'}`}>
                      {m.message || m.body || '—'}
                    </p>
                    {(m.message || m.body || '').length > 80 && (
                      <button onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                        className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600">
                        {expandedId === m.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </td>
                <td className="table-cell text-xs text-gray-500">
                  {m.created_at ? format(new Date(m.created_at), 'dd MMM yyyy HH:mm') : 'N/A'}
                </td>
                <td className="table-cell">
                  <span className={`badge ${m.status === 'resolved' ? 'badge-green' : 'badge-yellow'}`}>
                    {m.status || 'open'}
                  </span>
                </td>
                <td className="table-cell">
                  {m.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(m.id)}
                      disabled={resolvingId === m.id}
                      className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50"
                      title="Mark Resolved"
                    >
                      {resolvingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
