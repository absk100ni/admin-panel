import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Upload, Download, RefreshCw, Trash2, Package, Image, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', compare_at_price: '',
    stock: '', sku: '', tags: '', weight: '',
  });
  const [thumbnail, setThumbnail] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const multiImgRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/products', { params: { search } })
      .then(r => setProducts(r.data.products || []))
      .catch(() => api.get('/products', { params: { search } }).then(r => setProducts(r.data.products || [])).catch(() => {}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ========== CSV UPLOAD ==========
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
      if (res.data.errors?.length) res.data.errors.slice(0, 3).forEach((e: string) => toast.error(e));
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

  // ========== IMAGE UPLOAD ==========
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/admin/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.public_url;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB per image'); return; }
    setImageUploading(true);
    try {
      const url = await uploadImage(file);
      setThumbnail(url);
      toast.success('Thumbnail uploaded!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImageUploading(true);
    const newImages: string[] = [];
    for (let i = 0; i < files.length && i < 6; i++) {
      if (files[i].size > 5 * 1024 * 1024) { toast.error(`${files[i].name} too large (max 5MB)`); continue; }
      try {
        const url = await uploadImage(files[i]);
        newImages.push(url);
      } catch { toast.error(`Failed to upload ${files[i].name}`); }
    }
    setImages([...images, ...newImages]);
    if (newImages.length) toast.success(`${newImages.length} images uploaded!`);
    setImageUploading(false);
    if (multiImgRef.current) multiImgRef.current.value = '';
  };

  // ========== CREATE PRODUCT ==========
  const handleCreate = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    try {
      await api.post('/admin/products', {
        name: form.name,
        description: form.description,
        category: form.category,
        price: Math.round(parseFloat(form.price) * 100),
        compare_at_price: form.compare_at_price ? Math.round(parseFloat(form.compare_at_price) * 100) : 0,
        stock: parseInt(form.stock) || 100,
        weight: parseInt(form.weight) || 0,
        sku: form.sku,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        thumbnail: thumbnail,
        images: images,
      });
      toast.success('Product created!');
      setShowForm(false);
      setForm({ name: '', description: '', category: '', price: '', compare_at_price: '', stock: '', sku: '', tags: '', weight: '' });
      setThumbnail('');
      setImages([]);
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to create product'); }
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

      {/* ========== ADD PRODUCT FORM (with Image Upload) ========== */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Add New Product</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Product Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., iPhone 15 Pro Max" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1499" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">MRP (₹) — strikethrough</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1999" type="number" value={form.compare_at_price} onChange={e => setForm({...form, compare_at_price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Smartphones" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU (auto if empty)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Auto-generated" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="100" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weight (grams)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="500" type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="electronics, bestseller, new" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Product description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>

            {/* Right: Image Upload */}
            <div className="space-y-4">
              {/* Thumbnail */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Main Thumbnail *</label>
                <input ref={imgRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                {thumbnail ? (
                  <div className="relative w-full h-40 rounded-xl border-2 border-blue-200 overflow-hidden group">
                    <img src={thumbnail} className="w-full h-full object-cover" />
                    <button onClick={() => setThumbnail('')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => imgRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    {imageUploading ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> : <Image className="w-8 h-8 text-gray-400" />}
                    <span className="text-xs text-gray-500">{imageUploading ? 'Uploading...' : 'Click to upload thumbnail'}</span>
                    <span className="text-[10px] text-gray-400">JPG, PNG, WebP • Max 5MB</span>
                  </button>
                )}
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Gallery Images (up to 6)</label>
                <input ref={multiImgRef} type="file" accept="image/*" multiple onChange={handleMultiImageUpload} className="hidden" />
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative h-20 rounded-lg border overflow-hidden group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <button onClick={() => multiImgRef.current?.click()}
                      className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      {imageUploading ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <Plus className="w-5 h-5 text-gray-400" />}
                      <span className="text-[10px] text-gray-400 mt-0.5">Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button onClick={handleCreate} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Create Product
            </button>
            <button onClick={() => { setShowForm(false); setThumbnail(''); setImages([]); }} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
              Cancel
            </button>
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
