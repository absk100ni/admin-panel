import { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/products', { params: { limit: 500 } })
      .then(r => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 20);
  const outOfStock = products.filter(p => (p.stock || 0) === 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Products</p>
        </div>
        <div className="stat-card">
          <p className="text-3xl font-bold text-gray-900">{totalStock.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Total Units in Stock</p>
        </div>
        <div className="stat-card">
          <p className="text-3xl font-bold text-amber-600">{lowStock.length}</p>
          <p className="text-sm text-gray-500 mt-1">Low Stock (&le;20)</p>
        </div>
        <div className="stat-card">
          <p className="text-3xl font-bold text-red-600">{outOfStock.length}</p>
          <p className="text-sm text-gray-500 mt-1">Out of Stock</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Low Stock Alerts
          </h3>
          <div className="space-y-1">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{p.name}</span>
                <span className="font-medium text-amber-800">{p.stock} units left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-header">Product</th>
              <th className="table-header">Category</th>
              <th className="table-header">SKU</th>
              <th className="table-header">Price</th>
              <th className="table-header">Stock</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell text-sm">{p.category || '—'}</td>
                <td className="table-cell text-xs font-mono">{p.sku || '—'}</td>
                <td className="table-cell font-medium">₹{((p.price || 0) / 100).toLocaleString('en-IN')}</td>
                <td className="table-cell">
                  <span className={`badge ${p.stock > 20 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'}`}>
                    {p.stock ?? 0}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
