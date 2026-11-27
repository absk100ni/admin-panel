import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Upload, Download, RefreshCw, Trash2, Edit2, Package, Image, X, Loader2, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getPresignedUrl, getCategoryTree } from '../services/api';
import type { Category } from '../types/category';

const emptyForm = {
  name: '', description: '', category: '', price: '', compare_at_price: '',
  stock: '', sku: '', tags: '', weight: '', length_cm: '', width_cm: '', height_cm: '', gst_percent: '', hsn_code: '', advance_percent: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [thumbnail, setThumbnail] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const multiImgRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/products', { params: { search, limit: 500 } })
      .then(r => setProducts(r.data.products || []))
      .catch((err: any) => {
        setProducts([]);
        toast.error(err.response?.data?.error || 'Failed to load the complete catalog');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    getCategoryTree()
      .then(r => setCategoryTree(r.data.categories || []))
      .catch(() => {});
  }, []);

  const flattenCats = (cats: Category[], prefix = ''): { id: string; label: string }[] => {
    const result: { id: string; label: string }[] = [];
    for (const cat of cats) {
      const indent = prefix ? `${prefix} ${cat.name}` : cat.name;
      result.push({ id: cat.slug || cat.id, label: indent });
      if (cat.children?.length) {
        flattenCats(cat.children, indent.startsWith('—') ? `—${indent}` : '—').forEach(c => result.push(c));
      }
    }
    return result;
  };
  const categoryOptions = flattenCats(categoryTree);

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

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/products/export-csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Export failed');
    }
  };

  const uploadImagePresigned = async (file: File): Promise<string> => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) throw new Error('Only JPEG, PNG, and WebP images are allowed');
    if (file.size > 5 * 1024 * 1024) throw new Error('File must be under 5MB');
    const res = await getPresignedUrl(file.name, file.type);
    const { upload_url, public_url } = res.data;
    await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    return public_url;
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      return await uploadImagePresigned(file);
    } catch (presignErr: any) {
      if (presignErr.response?.status === 404 || presignErr.message?.includes('Only')) {
        if (presignErr.message?.includes('Only') || presignErr.message?.includes('5MB')) throw presignErr;
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/admin/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data.public_url;
      }
      throw presignErr;
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setUploadProgress(30);
    try {
      const url = await uploadImage(file);
      setThumbnail(url);
      setUploadProgress(100);
      toast.success('Thumbnail uploaded!');
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.error || 'Image upload failed');
    } finally {
      setImageUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImageUploading(true);
    const newImages: string[] = [];
    for (let i = 0; i < files.length && i < 6; i++) {
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      try {
        const url = await uploadImage(files[i]);
        newImages.push(url);
      } catch (err: any) {
        toast.error(err.message || `Failed to upload ${files[i].name}`);
      }
    }
    setImages([...images, ...newImages]);
    if (newImages.length) toast.success(`${newImages.length} images uploaded!`);
    setImageUploading(false);
    setUploadProgress(0);
    if (multiImgRef.current) multiImgRef.current.value = '';
  };

  // --- VALIDATION (P0-2a): reject negative/zero price, negative stock, sane parsing ---
  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'Product name is required';
    const price = parseFloat(form.price);
    if (!form.price || isNaN(price) || price <= 0) return 'Price must be a positive number';
    if (form.compare_at_price) {
      const compare = parseFloat(form.compare_at_price);
      if (isNaN(compare) || compare <= 0) return 'MRP must be a positive number';
      if (compare < price) return 'MRP must be greater than or equal to selling price';
    }
    if (form.stock) {
      const stock = parseInt(form.stock);
      if (isNaN(stock) || stock < 0) return 'Stock cannot be negative';
    }
    if (!form.weight) return 'Shipping weight is required';
    const weight = parseInt(form.weight, 10);
    if (isNaN(weight) || weight <= 0) return 'Weight must be greater than 0 grams';
    for (const [label, raw] of [['Length', form.length_cm], ['Width', form.width_cm], ['Height', form.height_cm]] as const) {
      const value = parseInt(raw, 10);
      if (isNaN(value) || value <= 0) return `${label} must be greater than 0 cm`;
    }
    const gstPercent = parseInt(form.gst_percent, 10);
    if (!Number.isInteger(gstPercent) || gstPercent <= 0 || gstPercent > 100) return 'GST percentage must be a whole number between 1 and 100';
    if (!/^\d{4,8}$/.test(form.hsn_code)) return 'HSN code must contain 4 to 8 digits';
    if (form.advance_percent) {
      const adv = parseInt(form.advance_percent);
      if (isNaN(adv) || adv < 0 || adv > 100) return 'Advance % must be 0–100';
    }
    return null;
  };

  /**
   * PAISE/RUPEE ROUND-TRIP PROOF:
   *
   * Backend stores prices in PAISE (integer).
   * Form displays/accepts RUPEES (decimal).
   *
   * CREATE: form.price (rupees) → Math.round(parseFloat(form.price) * 100) → paise to backend
   * EDIT PREFILL: product.price (paise from backend) → (paise / 100).toString() → rupees in form
   * EDIT SUBMIT: form.price (rupees) → Math.round(parseFloat(form.price) * 100) → paise to backend
   *
   * The conversion is symmetric: divide by 100 on read, multiply by 100 on write.
   * Math.round prevents floating-point drift (e.g., 14.99 * 100 = 1498.9999... → rounds to 1499).
   */
  const rupeesToPaise = (rupees: string): number => Math.round(parseFloat(rupees) * 100);

  const buildPayload = () => ({
    name: form.name,
    description: form.description,
    category: form.category,
    price: rupeesToPaise(form.price),
    compare_at_price: form.compare_at_price ? rupeesToPaise(form.compare_at_price) : 0,
    stock: form.stock === '' ? 100 : parseInt(form.stock, 10),
    weight: parseInt(form.weight) || 0,
    length_cm: parseInt(form.length_cm, 10),
    width_cm: parseInt(form.width_cm, 10),
    height_cm: parseInt(form.height_cm, 10),
    gst_percent: parseInt(form.gst_percent, 10),
    hsn_code: form.hsn_code,
    sku: form.sku,
    tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
    thumbnail,
    images,
    advance_percent: form.advance_percent ? parseInt(form.advance_percent) : null,
  });

  const handleSave = async () => {
    const error = validateForm();
    if (error) { toast.error(error); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created!');
      }
      closeForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // P0-1: Open edit form prefilled with existing product data (paise→rupees conversion)
  const openEdit = (p: any) => {
    setEditingProduct(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      category: p.category || '',
      price: p.price ? (p.price / 100).toString() : '',
      compare_at_price: p.compare_at_price ? (p.compare_at_price / 100).toString() : '',
      stock: p.stock?.toString() || '',
      sku: p.sku || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      weight: p.weight?.toString() || '',
      length_cm: p.length_cm?.toString() || '',
      width_cm: p.width_cm?.toString() || '',
      height_cm: p.height_cm?.toString() || '',
      gst_percent: p.gst_percent?.toString() || '',
      hsn_code: p.hsn_code || '',
      advance_percent: p.advance_percent != null ? p.advance_percent.toString() : '',
    });
    setThumbnail(p.thumbnail || '');
    setImages(p.images || []);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setThumbnail('');
    setImages([]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setThumbnail('');
    setImages([]);
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
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
        <strong>CSV Format:</strong> name, price (paise), category, description, sku, stock, weight, length_cm, width_cm, height_cm, gst_percent, hsn_code, tags (pipe-separated), thumbnail, images (pipe-separated), compare_at_price
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., iPhone 15 Pro Max" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1499" type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">MRP (₹) — strikethrough</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1999" type="number" min="0" step="0.01" value={form.compare_at_price} onChange={e => setForm({...form, compare_at_price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">— Select category</option>
                    {categoryOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU {editingProduct ? '' : '(auto if empty)'}</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Auto-generated" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="100" type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weight (g) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="500" type="number" min="1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Advance %</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Default 20%" type="number" min="0" max="100"
                    value={form.advance_percent} onChange={e => setForm({...form, advance_percent: e.target.value})} />
                  <p className="text-[10px] text-gray-400 mt-0.5">Customer pays this % online, rest on delivery</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Package length (cm) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min="1" value={form.length_cm} onChange={e => setForm({...form, length_cm: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min="1" value={form.width_cm} onChange={e => setForm({...form, width_cm: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min="1" value={form.height_cm} onChange={e => setForm({...form, height_cm: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GST rate (%) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min="1" max="100" step="1" value={form.gst_percent} onChange={e => setForm({...form, gst_percent: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">HSN code *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" inputMode="numeric" maxLength={8} value={form.hsn_code} onChange={e => setForm({...form, hsn_code: e.target.value.replace(/\D/g, '').slice(0, 8)})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="electronics, bestseller" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Product description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Main Thumbnail *</label>
                <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailUpload} className="hidden" />
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
                    <span className="text-[10px] text-gray-400">JPEG, PNG, WebP • Max 5MB</span>
                  </button>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Gallery Images (up to 6)</label>
                <input ref={multiImgRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleMultiImageUpload} className="hidden" />
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

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
            <button onClick={closeForm} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search products..."
          value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">Product</th>
              <th className="table-header">Category</th>
              <th className="table-header">Price</th>
              <th className="table-header">Advance</th>
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
                <td className="table-cell font-medium">₹{((p.price || 0) / 100).toLocaleString('en-IN')}{p.compare_at_price > 0 && <span className="text-xs text-gray-400 line-through ml-1">₹{(p.compare_at_price / 100).toLocaleString('en-IN')}</span>}</td>
                <td className="table-cell text-sm">{p.advance_percent != null ? `${p.advance_percent}%` : '20% (default)'}</td>
                <td className="table-cell"><span className={`badge ${p.stock > 20 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'}`}>{p.stock}</span></td>
                <td className="table-cell text-xs font-mono">{p.sku || '—'}</td>
                <td className="table-cell"><span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="p-1 text-gray-400 hover:text-primary-600" title="Edit product">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const base = import.meta.env.VITE_STORE_URL || 'http://localhost:3000';
                        navigator.clipboard.writeText(`${base}/p/${p.slug || p.id}`);
                        toast.success('Public product link copied — paste it in your reel/video!');
                      }}
                      className="p-1 text-gray-400 hover:text-violet-600" title="Copy public product link (for reels/videos)">
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 text-red-400 hover:text-red-600" title="Delete product">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">{loading ? 'Loading...' : 'No products found. Upload a CSV or add manually!'}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-4">{products.length} products total</p>
    </div>
  );
}
