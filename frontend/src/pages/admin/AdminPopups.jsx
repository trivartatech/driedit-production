import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Loader2, Bell, 
  X, Eye, EyeOff
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { toast } from 'sonner';

const INITIAL_POPUP = {
  title: '',
  description: '',
  image: '',
  button_text: '',
  redirect_url: '',
  active: true,
  display_type: 'once_per_session'
};

const DISPLAY_TYPES = [
  { value: 'once_per_session', label: 'Once per session' },
  { value: 'every_visit', label: 'Every visit' },
  { value: 'after_seconds', label: 'After delay' },
];

const AdminPopups = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [formData, setFormData] = useState(INITIAL_POPUP);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPopups();
      setPopups(response.data || []);
    } catch (error) {
      console.error('Error fetching popups:', error);
      toast.error('Failed to load popups');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (popup = null) => {
    if (popup) {
      setEditingPopup(popup);
      setFormData({
        title: popup.title,
        description: popup.description,
        image: popup.image || '',
        button_text: popup.button_text,
        redirect_url: popup.redirect_url,
        active: popup.active,
        display_type: popup.display_type
      });
    } else {
      setEditingPopup(null);
      setFormData(INITIAL_POPUP);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPopup(null);
    setFormData(INITIAL_POPUP);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.button_text || !formData.redirect_url) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingPopup) {
        await adminAPI.updatePopup(editingPopup.popup_id, formData);
        toast.success('Popup updated successfully');
      } else {
        await adminAPI.createPopup(formData);
        toast.success('Popup created successfully');
      }

      closeModal();
      fetchPopups();
    } catch (error) {
      console.error('Error saving popup:', error);
      toast.error(error.response?.data?.detail || 'Failed to save popup');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (popupId) => {
    try {
      await adminAPI.deletePopup(popupId);
      toast.success('Popup deleted');
      setDeleteConfirm(null);
      fetchPopups();
    } catch (error) {
      console.error('Error deleting popup:', error);
      toast.error('Failed to delete popup');
    }
  };

  const toggleActive = async (popup) => {
    try {
      await adminAPI.updatePopup(popup.popup_id, { ...popup, active: !popup.active });
      toast.success(popup.active ? 'Popup disabled' : 'Popup enabled');
      fetchPopups();
    } catch (error) {
      toast.error('Failed to update popup');
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
          <h1 className="text-4xl font-black">POPUPS</h1>
          <p className="text-gray-400 mt-1">Manage promotional popups</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-[#E10600] px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          data-testid="add-popup-btn"
        >
          <Plus size={18} />
          <span>Add Popup</span>
        </button>
      </div>

      {/* Popups List */}
      <div className="space-y-4" data-testid="popups-list">
        {popups.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10">
            <Bell size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No popups yet</p>
            <button 
              onClick={() => openModal()}
              className="mt-4 text-[#E10600] hover:underline font-bold"
            >
              Create your first popup
            </button>
          </div>
        ) : (
          popups.map((popup) => (
            <motion.div
              key={popup.popup_id}
              layout
              className={`bg-white/5 border border-white/10 p-4 ${!popup.active ? 'opacity-60' : ''}`}
              data-testid={`popup-card-${popup.popup_id}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-lg">{popup.title}</h3>
                    {!popup.active && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 font-bold">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{popup.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Button: <span className="text-white">{popup.button_text}</span></span>
                    <span>Display: <span className="text-white">{popup.display_type}</span></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(popup)}
                    className={`flex items-center space-x-1 px-3 py-2 text-sm font-bold transition-colors ${
                      popup.active 
                        ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    data-testid={`toggle-popup-btn-${popup.popup_id}`}
                  >
                    {popup.active ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{popup.active ? 'Active' : 'Inactive'}</span>
                  </button>
                  <button
                    onClick={() => openModal(popup)}
                    className="bg-white/5 p-2 hover:bg-white/10 transition-colors"
                    data-testid={`edit-popup-btn-${popup.popup_id}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(popup.popup_id)}
                    className="bg-red-500/20 text-red-500 p-2 hover:bg-red-500/30 transition-colors"
                    data-testid={`delete-popup-btn-${popup.popup_id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 w-full max-w-lg my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">
                  {editingPopup ? 'EDIT POPUP' : 'ADD POPUP'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="Welcome to DRIEDIT"
                    data-testid="popup-title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] h-20"
                    placeholder="Get 10% off on your first order!"
                    data-testid="popup-description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Image URL (optional)</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="https://example.com/popup.jpg"
                    data-testid="popup-image-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Button Text *</label>
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="SHOP NOW"
                      data-testid="popup-button-text-input"
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
                      data-testid="popup-redirect-url-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Display Type</label>
                    <select
                      value={formData.display_type}
                      onChange={(e) => setFormData({ ...formData, display_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      data-testid="popup-display-type-select"
                    >
                      {DISPLAY_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white/5 border border-white/10 w-full">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-5 h-5 accent-[#E10600]"
                        data-testid="popup-active-checkbox"
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
                    data-testid="save-popup-btn"
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
              <h2 className="text-xl font-black mb-2">DELETE POPUP?</h2>
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
                  data-testid="confirm-delete-popup-btn"
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

export default AdminPopups;
