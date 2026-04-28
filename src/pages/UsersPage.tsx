import { useState, useEffect } from 'react';
import { Search, Users, Sparkles, Calendar } from 'lucide-react';
import { getUsers } from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(r => setUsers(r.data.users || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => !search || u.phone?.includes(search) || u.id?.includes(search));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <span className="text-sm text-gray-500">{users.length} total</span>
      </div>
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search by phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-gray-50">
            <th className="table-header">User ID</th><th className="table-header">Phone</th>
            <th className="table-header">Credits</th><th className="table-header">Role</th>
            <th className="table-header">Joined</th>
          </tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">{u.id?.slice(0, 8)}</td>
                <td className="table-cell font-medium">{u.phone}</td>
                <td className="table-cell"><span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" />{u.credits}</span></td>
                <td className="table-cell"><span className={`badge ${u.is_admin ? 'badge-purple' : 'badge-gray'}`}>{u.is_admin ? 'Admin' : 'User'}</span></td>
                <td className="table-cell text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : ''}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-8">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
