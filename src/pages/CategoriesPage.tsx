import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, FolderTree, Loader2, Image, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCategoryTree, createCategory, updateCategory, deleteCategory, getPresignedUrl } from '../services/api';
import type { Category, CategoryFormData } from '../types/category';

// Flatten tree for parent select options
function flattenTree(categories: Category[], prefix = ''): { id: string; name: string; level: number; label: string }[] {
  const result: { id: string; name: string; level: number; label: string }[] = [];
  for (const cat of categories) {
    const indent = prefix ? `${prefix} ${cat.name}` : cat.name;
    result.push({ id: cat.id, name: cat.name, level: cat.level, label: indent });
    if (cat.children?.length) {
      flattenTree(cat.children, indent.startsWith('—') ? `—${indent}` : '—').forEach(c => result.push(c));
    }
  }
  return result;
}

// Get all descendant IDs of a category
function getDescendantIds(cat: Category): string[] {
  const ids: string[] = [cat.id];
  if (cat.children) {
    for (const child of cat.children) {
      ids.push(...getDescendantIds(child));
    }
  }
  return ids;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Tree node component
function CategoryNode({ category, onEdit, onDelete, expanded, onToggle }: {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expanded.has(category.id);

  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group transition-colors"
        style={{ paddingLeft: `${(category.level - 1) * 24 + 12}px` }}>
        {hasChildren ? (
          <button onClick={() => onToggle(category.id)} className="p-0.5 rounded hover:bg-gray-200">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {category.image ? (
          <img src={category.image} className="w-8 h-8 rounded-md object-cover border" alt={category.name} />
        ) : (
          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
            <FolderTree className="w-4 h-4 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 truncate">{category.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              category.level === 1 ? 'bg-blue-100 text-blue-700' :
              category.level === 2 ? 'bg-purple-100 text-purple-700' :
              'bg-orange-100 text-orange-700'
            }`}>L{category.level}</span>
            {!category.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">Inactive</span>
            )}
            {category.product_count !== undefined && (
              <span className="text-[10px] text-gray-400">{category.product_count} products</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">{category.slug}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(category)} className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(category)} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {category.children!.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>({
    name: '', slug: '', image: '', sort_order: 0, is_active: true, parent_id: null,
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const loadTree = async () => {
    setLoading(true);
    try {
      const res = await getCategoryTree();
      setTree(res.data.categories || []);
      // Auto-expand L1 categories
      const l1Ids = (res.data.categories || []).map((c: Category) => c.id);
      setExpanded(new Set(l1Ids));
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTree(); }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', slug: '', image: '', sort_order: 0, is_active: true, parent_id: null });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      image: cat.image || '',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active,
      parent_id: cat.parent_id || null,
    });
    setShowModal(true);
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory(cat.id);
      toast.success(`"${cat.name}" deleted`);
      loadTree();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || generateSlug(form.name),
      };
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success(`"${form.name}" updated`);
      } else {
        await createCategory(payload);
        toast.success(`"${form.name}" created`);
      }
      setShowModal(false);
      loadTree();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setImageUploading(true);
    try {
      const res = await getPresignedUrl(file.name, file.type);
      const { upload_url, public_url } = res.data;
      await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      setForm(f => ({ ...f, image: public_url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  // Build parent select options: exclude L3 categories (can't have children) and self + descendants when editing
  const getParentOptions = () => {
    const flat = flattenTree(tree);
    const excludeIds = editingCategory ? new Set(getDescendantIds(editingCategory)) : new Set<string>();
    return flat.filter(opt => opt.level < 3 && !excludeIds.has(opt.id));
  };

  const parentOptions = getParentOptions();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product category hierarchy (max 3 levels)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Tree View */}
      <div className="bg-white rounded-xl border shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-16">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No categories yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first category to organize products</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4 inline mr-1" /> Create First Category
            </button>
          </div>
        ) : (
          <div className="p-3 divide-y divide-gray-100">
            {tree.map(cat => (
              <CategoryNode
                key={cat.id}
                category={cat}
                onEdit={openEdit}
                onDelete={handleDelete}
                expanded={expanded}
                onToggle={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCategory ? `Edit "${editingCategory.name}"` : 'Create Category'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Electronics"
                  value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    setForm(f => ({ ...f, name, slug: generateSlug(name) }));
                  }}
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug (auto-generated)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent Category</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.parent_id || ''}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))}
                >
                  <option value="">— None (Root category)</option>
                  {parentOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {'—'.repeat(opt.level)} {opt.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Max 3 levels deep. L3 categories cannot have children.</p>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm text-gray-700">Active</span>
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Category Image</label>
                <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }} className="hidden" />
                {form.image ? (
                  <div className="relative w-32 h-32 rounded-lg border overflow-hidden group">
                    <img src={form.image} className="w-full h-full object-cover" alt="Category" />
                    <button onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => imgRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    {imageUploading ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> : <Image className="w-6 h-6 text-gray-400" />}
                    <span className="text-[10px] text-gray-400">{imageUploading ? 'Uploading...' : 'Upload'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
