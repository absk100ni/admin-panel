import { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, Trash2, Edit2, ToggleLeft, ToggleRight, X, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../services/api';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number;
  max_discount: number;
  usage_count: number;
  usage_limit: number;
  is_active: boolean;
  expires_at: string | null;
}

const emptyForm = {
  code: '', type: 'percentage' as 'percentage' | 'fixed', value: '',
  min_order: '', max_discount: '', usage_limit: '', expires_at: '', is_active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getCoupons()
      .then((r) => setCoupons(r.data.coupons || r.data || []))
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.type === 'fixed' ? c.value / 100 : c.value),
      min_order: c.min_order ? String(c.min_order / 100) : '',
      max_discount: c.max_discount ? String(c.max_discount / 100) : '',
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      is_active: c.is_active,
    });
    setShowModal(true);
  };

  // P0-2b: Coupon form validation
  const validateCouponForm = (): string | null => {
    if (!form.code.trim()) return 'Coupon code is required';
    if (!form.value) return 'Value is required';

    const value = parseFloat(form.value);
    if (isNaN(value)) return 'Value must be a number';

    if (form.type === 'percentage') {
      if (value < 1 || value > 100) return 'Percentage discount must be between 1 and 100';
      if (!Number.isInteger(value)) return 'Percentage must be a whole number';
    } else {
      if (value <= 0) return 'Fixed discount must be greater than 0';
    }

    if (form.min_order) {
      const minOrder = parseFloat(form.min_order);
      if (isNaN(minOrder) || minOrder < 0) return 'Minimum order must be 0 or positive';
    }

    if (form.max_discount) {
      const maxDiscount = parseFloat(form.max_discount);
      if (isNaN(maxDiscount) || maxDiscount < 0) return 'Max discount must be 0 or positive';
    }

    if (form.usage_limit) {
      const limit = parseInt(form.usage_limit);
      if (isNaN(limit) || limit < 0) return 'Usage limit must be 0 or positive';
    }

    return null;
  };

  const handleSave = async () => {
    const error = validateCouponForm();
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.type === 'fixed' ? Math.round(parseFloat(form.value) * 100) : parseInt(form.value),
      min_order: form.min_order ? Math.round(parseFloat(form.min_order) * 100) : 0,
      max_discount: form.max_discount ? Math.round(parseFloat(form.max_discount) * 100) : 0,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : 0,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await updateCoupon(editing.id, payload);
        toast.success('Coupon updated');
      } else {
        await createCoupon(payload);
        toast.success('Coupon created');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await updateCoupon(c.id, { is_active: !c.is_active });
      toast.success(c.is_active ? 'Coupon deactivated' : 'Coupon activated');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await deleteCoupon(c.id);
      toast.success('Coupon deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = coupons.filter(
    (c) => !search || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const formatValue = (c: Coupon) =>
    c.type === 'percentage' ? `${c.value}%` : `₹${(c.value / 100).toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <div className="flex gap-2">
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search coupons..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">Code</th>
              <th className="table-header">Type</th>
              <th className="table-header">Value</th>
              <th className="table-header">Min Order</th>
              <th className="table-header">Max Discount</th>
              <th className="table-header">Usage</th>
              <th className="table-header">Active</th>
              <th className="table-header">Expiry</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono font-medium text-sm">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-primary-500" /> {c.code}
                  </span>
                </td>
                <td className="table-cell capitalize text-sm">{c.type}</td>
                <td className="table-cell font-medium">{formatValue(c)}</td>
                <td className="table-cell text-sm">
                  {c.min_order ? `₹${(c.min_order / 100).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="table-cell text-sm">
                  {c.max_discount ? `₹${(c.max_discount / 100).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="table-cell text-sm">
                  {c.usage_count || 0}{c.usage_limit ? `/${c.usage_limit}` : ''}
                </td>
                <td className="table-cell">
                  <button onClick={() => handleToggle(c)}>
                    {c.is_active
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-gray-400" />
                    }
                  </button>
                </td>
                <td className="table-cell text-xs">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN') : 'Never'}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1 text-gray-400 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="table-cell text-center text-gray-400 py-8">
                {loading ? 'Loading...' : 'No coupons found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editing ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm uppercase" placeholder="SAVE20"
                  value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Value * {form.type === 'percentage' ? '(1–100%)' : '(₹)'}
                  </label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" placeholder="20"
                    min={form.type === 'percentage' ? '1' : '0.01'}
                    max={form.type === 'percentage' ? '100' : undefined}
                    value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Order (₹)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" placeholder="499" min="0"
                    value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount (₹)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" placeholder="200" min="0"
                    value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usage Limit</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" placeholder="100" min="0"
                  value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="date"
                  value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Active
              </label>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => setShowModal(false)}
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
