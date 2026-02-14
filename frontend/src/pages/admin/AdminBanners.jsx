import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Loader2, Image as ImageIcon, 
  X, Eye, EyeOff, GripVertical, ExternalLink
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { toast } from 'sonner';

const INITIAL_BANNER = {
  image: '',
  button_text: '',
  redirect_url: '',
  active: true,
  order_position: 0
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState(INITIAL_BANNER);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getBanners();
      setBanners(response.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        image: banner.image,
        button_text: banner.button_text,
        redirect_url: banner.redirect_url,
        active: banner.active,
        order_position: banner.order_position
      });
    } else {
      setEditingBanner(null);
      setFormData({ ...INITIAL_BANNER, order_position: banners.length });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBanner(null);
    setFormData(INITIAL_BANNER);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.image || !formData.button_text || !formData.redirect_url) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingBanner) {
        await adminAPI.updateBanner(editingBanner.banner_id, formData);
        toast.success('Banner updated successfully');
      } else {
        await adminAPI.createBanner(formData);
        toast.success('Banner created successfully');
      }

      closeModal();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error(error.response?.data?.detail || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bannerId) => {
    try {
      await adminAPI.deleteBanner(bannerId);
      toast.success('Banner deleted');
      setDeleteConfirm(null);
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const toggleActive = async (banner) => {
    try {
      await adminAPI.updateBanner(banner.banner_id, { ...banner, active: !banner.active });
      toast.success(banner.active ? 'Banner disabled' : 'Banner enabled');
      fetchBanners();
    } catch (error) {
      toast.error('Failed to update banner');
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
        <div>
          <h1 className="text-4xl font-black">HERO BANNERS</h1>
          <p className="text-gray-400 mt-1">Manage homepage slider banners</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-[#E10600] px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          data-testid="add-banner-btn"
        >
          <Plus size={18} />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4" data-testid="banners-list">
        {banners.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No banners yet</p>
            <button 
              onClick={() => openModal()}
              className="mt-4 text-[#E10600] hover:underline font-bold"
            >
              Add your first banner
            </button>
          </div>
        ) : (
          banners.map((banner, index) => (
            <motion.div
              key={banner.banner_id}
              layout
              className={`bg-white/5 border border-white/10 overflow-hidden ${!banner.active ? 'opacity-60' : ''}`}
              data-testid={`banner-card-${banner.banner_id}`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="w-full md:w-64 h-40 relative">
                  <img 
                    src={banner.image} 
                    alt={banner.button_text}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="bg-[#E10600] text-white px-4 py-2 font-bold text-sm">
                      {banner.button_text}
                    </span>
                  </div>
                  {!banner.active && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                      DISABLED
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-gray-400">Position:</span>
                      <span className="font-bold">{banner.order_position + 1}</span>
                    </div>
                    <p className="text-sm text-gray-400 flex items-center space-x-1">
                      <ExternalLink size={14} />
                      <span className="truncate">{banner.redirect_url}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={() => toggleActive(banner)}
                      className={`flex items-center space-x-1 px-3 py-2 text-sm font-bold transition-colors ${
                        banner.active 
                          ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                      data-testid={`toggle-banner-btn-${banner.banner_id}`}
                    >
                      {banner.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{banner.active ? 'Active' : 'Inactive'}</span>
                    </button>
                    <button
                      onClick={() => openModal(banner)}
                      className="bg-white/5 p-2 hover:bg-white/10 transition-colors"
                      data-testid={`edit-banner-btn-${banner.banner_id}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(banner.banner_id)}
                      className="bg-red-500/20 text-red-500 p-2 hover:bg-red-500/30 transition-colors"
                      data-testid={`delete-banner-btn-${banner.banner_id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Banner Modal */}
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
              className="bg-[#111] border border-white/10 p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">
                  {editingBanner ? 'EDIT BANNER' : 'ADD BANNER'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Image URL *</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="https://example.com/banner.jpg"
                    data-testid="banner-image-input"
                  />
                  {formData.image && (
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="mt-2 w-full h-32 object-cover border border-white/10"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Button Text *</label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="SHOP NOW"
                    data-testid="banner-button-text-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Redirect URL *</label>
                  <input
                    type="text"
                    value={formData.redirect_url}
                    onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="/products"
                    data-testid="banner-redirect-url-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Position</label>
                    <input
                      type="number"
                      value={formData.order_position}
                      onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      min="0"
                      data-testid="banner-position-input"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white/5 border border-white/10 w-full">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-5 h-5 accent-[#E10600]"
                        data-testid="banner-active-checkbox"
                      />
                      <span className="font-bold">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
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
                    data-testid="save-banner-btn"
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
              <h2 className="text-xl font-black mb-2">DELETE BANNER?</h2>
              <p className="text-gray-400 mb-6">This action cannot be undone.</p>
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
                  data-testid="confirm-delete-banner-btn"
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

export default AdminBanners;
