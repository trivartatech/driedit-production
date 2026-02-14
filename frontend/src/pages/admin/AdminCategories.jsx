import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { categoriesAPI } from '../../services/api';
import { toast } from '../../hooks/use-toast';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.category_id, formData);
        toast({ title: 'Category updated successfully' });
      } else {
        await categoriesAPI.create(formData);
        toast({ title: 'Category created successfully' });
      }
      setFormData({ name: '', slug: '' });
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ title: error.response?.data?.detail || 'Error saving category', variant: 'destructive' });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesAPI.delete(id);
      toast({ title: 'Category deleted successfully' });
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: error.response?.data?.detail || 'Error deleting category', variant: 'destructive' });
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (loading) {
    return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E10600] mx-auto"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black">CATEGORIES</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingCategory(null); setFormData({ name: '', slug: '' }); }}
          className="bg-[#E10600] text-white px-6 py-3 font-bold flex items-center space-x-2 hover:bg-white hover:text-black transition-colors"
        >
          <Plus size={20} />
          <span>ADD CATEGORY</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-black mb-4">{editingCategory ? 'EDIT CATEGORY' : 'NEW CATEGORY'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                }}
                className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="bg-[#E10600] text-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors">
                {editingCategory ? 'UPDATE' : 'CREATE'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingCategory(null); setFormData({ name: '', slug: '' }); }} className="bg-white/10 text-white px-6 py-3 font-bold hover:bg-white/20 transition-colors">
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/5 border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className="text-left p-4 font-bold">Name</th>
              <th className="text-left p-4 font-bold">Slug</th>
              <th className="text-right p-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.category_id} className="border-b border-white/10">
                <td className="p-4">{category.name}</td>
                <td className="p-4 text-gray-400">{category.slug}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(category)} className="text-blue-400 hover:text-blue-300 mr-4">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(category.category_id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategories;