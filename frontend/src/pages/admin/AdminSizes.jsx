import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2, Check, X, ToggleLeft, ToggleRight, Layers, AlertCircle } from 'lucide-react';
import { sizesAPI } from '../../services/api';
import { toast } from 'sonner';

const AdminSizes = () => {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  
  const [form, setForm] = useState({
    name: '',
    category_type: 'clothing',
    active: true
  });

  const CATEGORY_TYPES = [
    { value: 'clothing', label: 'Clothing (T-shirts, Hoodies)' },
    { value: 'bottomwear', label: 'Bottomwear (Jeans, Pants)' },
    { value: 'footwear', label: 'Footwear (Shoes)' }
  ];

  useEffect(() => {
    loadSizes();
  }, [showInactive]);

  const loadSizes = async () => {
    try {
      setLoading(true);
      const response = await sizesAPI.getAll(showInactive);
      setSizes(response.data.sizes || []);
    } catch (error) {
      console.error('Error loading sizes:', error);
      toast.error('Failed to load sizes');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSizes = async () => {
    try {
      const response = await sizesAPI.seed();
      toast.success(`Added ${response.data.added_count} sizes`);
      loadSizes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to seed sizes');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      category_type: 'clothing',
      active: true
    });
    setEditingSize(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (size) => {
    setEditingSize(size);
    setForm({
      name: size.name,
      category_type: size.category_type,
      active: size.active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error('Size name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingSize) {
        await sizesAPI.update(editingSize.size_id, form);
        toast.success('Size updated successfully');
      } else {
        await sizesAPI.create(form);
        toast.success('Size created successfully');
      }
      setShowModal(false);
      resetForm();
      loadSizes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save size');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (size) => {
    if (!window.confirm(`Delete size "${size.name}"? This cannot be undone.`)) return;
    
    try {
      await sizesAPI.delete(size.size_id);
      toast.success('Size deleted');
      loadSizes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete size');
    }
  };

  const handleToggle = async (size) => {
    try {
      await sizesAPI.toggle(size.size_id);
      toast.success(size.active ? 'Size deactivated' : 'Size activated');
      loadSizes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to toggle size');
    }
  };

  // Group sizes by category_type
  const groupedSizes = sizes.reduce((acc, size) => {
    const type = size.category_type || 'clothing';
    if (!acc[type]) acc[type] = [];
    acc[type].push(size);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black">SIZE MANAGEMENT</h1>
          <p className="text-gray-400 text-sm mt-1">Manage product sizes dynamically</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-[#E10600]"
            />
            <span className="text-gray-400">Show inactive</span>
          </label>
          {sizes.length === 0 && (
            <button
              onClick={handleSeedSizes}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 text-sm font-bold hover:bg-white/20 transition-colors flex items-center space-x-2"
              data-testid="seed-sizes-btn"
            >
              <Layers size={16} />
              <span>SEED DEFAULT SIZES</span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="bg-[#E10600] text-white px-4 py-2 text-sm font-bold hover:bg-white hover:text-black transition-colors flex items-center space-x-2"
            data-testid="add-size-btn"
          >
            <Plus size={16} />
            <span>ADD SIZE</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sizes.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-bold mb-2">No Sizes Found</h3>
          <p className="text-gray-400 mb-4">Click "Seed Default Sizes" to add common sizes automatically.</p>
        </div>
      )}

      {/* Sizes by Category */}
      {Object.entries(groupedSizes).map(([categoryType, categorySizes]) => (
        <div key={categoryType} className="mb-8">
          <h2 className="text-lg font-bold mb-4 uppercase text-gray-400 border-b border-white/10 pb-2">
            {CATEGORY_TYPES.find(c => c.value === categoryType)?.label || categoryType}
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categorySizes.map((size) => (
              <motion.div
                key={size.size_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white/5 border p-4 relative group ${
                  size.active ? 'border-white/10' : 'border-red-500/30 opacity-60'
                }`}
                data-testid={`size-card-${size.size_id}`}
              >
                <div className="text-center">
                  <span className="text-2xl font-black">{size.name}</span>
                  {!size.active && (
                    <span className="block text-xs text-red-500 mt-1">INACTIVE</span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggle(size)}
                    className={`p-1 ${size.active ? 'text-green-500' : 'text-gray-500'} hover:text-white`}
                    title={size.active ? 'Deactivate' : 'Activate'}
                    data-testid={`toggle-size-${size.size_id}`}
                  >
                    {size.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => openEditModal(size)}
                    className="p-1 text-gray-400 hover:text-white"
                    title="Edit"
                    data-testid={`edit-size-${size.size_id}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(size)}
                    className="p-1 text-gray-400 hover:text-[#E10600]"
                    title="Delete"
                    data-testid={`delete-size-${size.size_id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
              data-testid="size-modal"
            >
              <div className="p-6">
                <h3 className="text-xl font-black mb-6">
                  {editingSize ? 'EDIT SIZE' : 'ADD NEW SIZE'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Size Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                      placeholder="e.g., XL, 32, 10"
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      data-testid="size-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Category Type</label>
                    <select
                      value={form.category_type}
                      onChange={(e) => setForm({ ...form, category_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      data-testid="size-category-select"
                    >
                      {CATEGORY_TYPES.map((type) => (
                        <option key={type.value} value={type.value} className="bg-[#111]">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-4 h-4 accent-[#E10600]"
                      data-testid="size-active-checkbox"
                    />
                    <span className="text-sm">Active (available for products)</span>
                  </label>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
                      data-testid="cancel-btn"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-[#E10600] py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      data-testid="save-size-btn"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>SAVING...</span>
                        </>
                      ) : (
                        <span>{editingSize ? 'UPDATE' : 'CREATE'} SIZE</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSizes;
