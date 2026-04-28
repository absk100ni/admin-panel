import { useState } from 'react';
import { Package, Check, X, Edit2 } from 'lucide-react';

const defaultInventory = {
  colors: [
    { name: 'Black', hex: '#000000', stock: 150, enabled: true },
    { name: 'White', hex: '#FFFFFF', stock: 120, enabled: true },
    { name: 'Navy', hex: '#1B2A4A', stock: 80, enabled: true },
  ],
  types: [
    { name: 'Round Neck', slug: 'round-neck', stock: 200, enabled: true },
    { name: 'Oversized', slug: 'oversized', stock: 150, enabled: true },
  ],
  sizes: [
    { label: 'S', stock: 45, enabled: true }, { label: 'M', stock: 80, enabled: true },
    { label: 'L', stock: 65, enabled: true }, { label: 'XL', stock: 50, enabled: true },
    { label: 'XXL', stock: 30, enabled: true },
  ],
  price: 499,
  isAvailable: true,
};

export default function InventoryPage() {
  const [inv] = useState(defaultInventory);

  const totalStock = inv.sizes.reduce((s, sz) => s + sz.stock, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <div className="flex items-center gap-2">
          <span className={`badge ${inv.isAvailable ? 'badge-green' : 'badge-red'}`}>
            {inv.isAvailable ? 'Store Open' : 'Store Closed'}
          </span>
          <span className="text-sm text-gray-500">Price: ₹{inv.price}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card"><p className="text-3xl font-bold text-gray-900">{totalStock}</p><p className="text-sm text-gray-500 mt-1">Total Units in Stock</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-gray-900">{inv.colors.length}</p><p className="text-sm text-gray-500 mt-1">Colors Available</p></div>
        <div className="stat-card"><p className="text-3xl font-bold text-gray-900">{inv.types.length}</p><p className="text-sm text-gray-500 mt-1">Styles Available</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-4 h-4" /> Colors</h3>
          <div className="space-y-3">
            {inv.colors.map(c => (
              <div key={c.name} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: c.hex }} />
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.stock} units</p>
                  </div>
                </div>
                {c.enabled ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Styles</h3>
          <div className="space-y-3">
            {inv.types.map(t => (
              <div key={t.slug} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-gray-400">{t.stock} units</p></div>
                {t.enabled ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Sizes</h3>
          <div className="space-y-3">
            {inv.sizes.map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold">{s.label}</span>
                  <p className="text-xs text-gray-400">{s.stock} units</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${s.stock > 20 ? 'bg-green-500' : s.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
