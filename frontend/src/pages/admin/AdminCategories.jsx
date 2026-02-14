import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader2, Tag, X } from 'lucide-react';
import { categoriesAPI } from '../../services/api';
import { toast } from 'sonner';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, slug: category.slug });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '' });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '' });
  };

  const handleNameChange = (name) => {
    setFormData({
      name,
      slug: editingCategory ? formData.slug : generateSlug(name)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast.error('Please fill all fields');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.category_id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Category created successfully');
      }

      closeModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.detail || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    try {
      await categoriesAPI.delete(categoryId);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black">CATEGORIES</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-[#E10600] px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          data-testid="add-category-btn"
        >
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="categories-grid">
        {categories.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/5 border border-white/10">
            <Tag size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No categories yet</p>
            <button 
              onClick={() => openModal()}
              className="mt-4 text-[#E10600] hover:underline font-bold"
            >
              Add your first category
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <motion.div
              key={category.category_id}
              layout
              className="bg-white/5 border border-white/10 p-4"
              data-testid={`category-card-${category.category_id}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                  <p className="text-sm text-gray-400">/{category.slug}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal(category)}
                    className="bg-white/5 p-2 hover:bg-white/10 transition-colors"
                    data-testid={`edit-category-btn-${category.category_id}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(category.category_id)}
                    className="bg-red-500/20 text-red-500 p-2 hover:bg-red-500/30 transition-colors"
                    data-testid={`delete-category-btn-${category.category_id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">
                  {editingCategory ? 'EDIT CATEGORY' : 'ADD CATEGORY'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="e.g., T-Shirts"
                    data-testid="category-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="e.g., t-shirts"
                    data-testid="category-slug-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#E10600] py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    data-testid="save-category-btn"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 w-full max-w-sm text-center"
              onClick={e => e.stopPropagation()}
            >
              <Trash2 size={48} className="mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-black mb-2">DELETE CATEGORY?</h2>
              <p className="text-gray-400 mb-6">Products in this category will become uncategorized.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-500 py-3 font-bold hover:bg-red-600 transition-colors"
                  data-testid="confirm-delete-category-btn"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
