import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Upload, Download, RefreshCw, Trash2, Edit, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '', stock: '', sku: '', tags: '', thumbnail: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/products', { params: { search } })
      .then(r => setProducts(r.data.products || []))
      .catch(() => api.get('/products', { params: { search } }).then(r => setProducts(r.data.products || [])).catch(() => {}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/products/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${res.data.created} products uploaded, ${res.data.failed} failed`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleExport = () => {
    window.open(`${api.defaults.baseURL}/admin/products/export-csv`, '_blank');
  };

  const handleCreate = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    try {
      await api.post('/admin/products', {
        name: form.name, description: form.description, category: form.category,
        price: parseInt(form.price) * 100, stock: parseInt(form.stock) || 100,
        sku: form.sku, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        thumbnail: form.thumbnail,
      });
      toast.success('Product created!');
      setShowForm(false);
      setForm({ name: '', description: '', category: '', price: '', stock: '', sku: '', tags: '', thumbnail: '' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/admin/products/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CSV format hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
        <strong>CSV Format:</strong> name, price (paise), category, description, sku, stock, weight, tags (pipe-separated), thumbnail, images (pipe-separated), compare_at_price
      </div>

      {/* Quick add form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-4 mb-6 shadow-sm">
          <h3 className="font-semibold mb-3">Quick Add Product</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Product Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Price (₹) *" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Tags (comma sep)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search products..."
          value={search} onChange={e => { setSearch(e.target.value); }} onKeyDown={e => e.key === 'Enter' && load()} />
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">Product</th>
              <th className="table-header">Category</th>
              <th className="table-header">Price</th>
              <th className="table-header">Stock</th>
              <th className="table-header">SKU</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    {p.thumbnail ? <img src={p.thumbnail} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>}
                    <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-400">{p.slug}</p></div>
                  </div>
                </td>
                <td className="table-cell text-sm">{p.category || '—'}</td>
                <td className="table-cell font-medium">₹{((p.price || 0) / 100).toFixed(0)}{p.compare_at_price > 0 && <span className="text-xs text-gray-400 line-through ml-1">₹{(p.compare_at_price / 100).toFixed(0)}</span>}</td>
                <td className="table-cell"><span className={`badge ${p.stock > 20 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'}`}>{p.stock}</span></td>
                <td className="table-cell text-xs font-mono">{p.sku || '—'}</td>
                <td className="table-cell"><span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="table-cell">
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">{loading ? 'Loading...' : 'No products found. Upload a CSV or add manually!'}</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">{products.length} products total</p>
    </div>
  );
}
