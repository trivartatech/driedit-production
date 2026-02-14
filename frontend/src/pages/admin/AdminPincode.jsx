import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Plus, Trash2, Edit2, Search, Loader2, 
  Percent, X, Check, XCircle 
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { toast } from 'sonner';

const formatPrice = (price) => `₹${price?.toLocaleString('en-IN') || 0}`;

const AdminPincode = () => {
  const [pincodes, setPincodes] = useState([]);
  const [gst, setGst] = useState({ gst_percentage: 18 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPincode, setEditingPincode] = useState(null);
  const [formData, setFormData] = useState({ pincode: '', shipping_charge: '', cod_available: true });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [gstEditing, setGstEditing] = useState(false);
  const [newGst, setNewGst] = useState('');
  const [savingGst, setSavingGst] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pincodesRes, gstRes] = await Promise.all([
        adminAPI.getPincodes(),
        adminAPI.getGST()
      ]);
      setPincodes(pincodesRes.data || []);
      setGst(gstRes.data || { gst_percentage: 18 });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (pincode = null) => {
    if (pincode) {
      setEditingPincode(pincode);
      setFormData({
        pincode: pincode.pincode,
        shipping_charge: pincode.shipping_charge,
        cod_available: pincode.cod_available
      });
    } else {
      setEditingPincode(null);
      setFormData({ pincode: '', shipping_charge: '', cod_available: true });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPincode(null);
    setFormData({ pincode: '', shipping_charge: '', cod_available: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pincode || formData.pincode.length !== 6) {
      toast.error('Please enter valid 6-digit pincode');
      return;
    }

    if (formData.shipping_charge === '' || formData.shipping_charge < 0) {
      toast.error('Please enter valid shipping charge');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pincode: formData.pincode,
        shipping_charge: parseFloat(formData.shipping_charge),
        cod_available: formData.cod_available
      };

      if (editingPincode) {
        await adminAPI.updatePincode(editingPincode.pincode, payload);
        toast.success('Pincode updated successfully');
      } else {
        await adminAPI.createPincode(payload);
        toast.success('Pincode added successfully');
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving pincode:', error);
      toast.error(error.response?.data?.detail || 'Failed to save pincode');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pincode) => {
    try {
      await adminAPI.deletePincode(pincode);
      toast.success('Pincode deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting pincode:', error);
      toast.error('Failed to delete pincode');
    }
  };

  const handleGstUpdate = async () => {
    if (!newGst || newGst < 0 || newGst > 100) {
      toast.error('Please enter valid GST percentage (0-100)');
      return;
    }

    setSavingGst(true);
    try {
      await adminAPI.updateGST(parseFloat(newGst));
      toast.success('GST updated successfully');
      setGst({ ...gst, gst_percentage: parseFloat(newGst) });
      setGstEditing(false);
    } catch (error) {
      console.error('Error updating GST:', error);
      toast.error('Failed to update GST');
    } finally {
      setSavingGst(false);
    }
  };

  const filteredPincodes = pincodes.filter(p =>
    p.pincode.includes(searchTerm)
  );

  const stats = {
    total: pincodes.length,
    codEnabled: pincodes.filter(p => p.cod_available).length,
    freeShipping: pincodes.filter(p => p.shipping_charge === 0).length,
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
      <h1 className="text-4xl font-black mb-8">PINCODE & GST</h1>

      {/* GST Section */}
      <div className="bg-white/5 border border-white/10 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-[#E10600] p-3">
              <Percent size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black">GST PERCENTAGE</h2>
              <p className="text-gray-400 text-sm">Applied to all orders</p>
            </div>
          </div>
          
          {gstEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={newGst}
                onChange={(e) => setNewGst(e.target.value)}
                className="w-24 bg-white/5 border border-white/10 px-3 py-2 focus:outline-none focus:border-[#E10600]"
                placeholder={gst.gst_percentage}
                min="0"
                max="100"
                step="0.1"
                data-testid="gst-input"
              />
              <span className="text-gray-400">%</span>
              <button
                onClick={handleGstUpdate}
                disabled={savingGst}
                className="bg-green-500 p-2 hover:bg-green-600 transition-colors disabled:opacity-50"
                data-testid="save-gst-btn"
              >
                {savingGst ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              </button>
              <button
                onClick={() => setGstEditing(false)}
                className="bg-red-500/20 text-red-500 p-2 hover:bg-red-500/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-black text-[#E10600]">{gst.gst_percentage}%</span>
              <button
                onClick={() => {
                  setNewGst(gst.gst_percentage.toString());
                  setGstEditing(true);
                }}
                className="bg-white/5 p-2 hover:bg-white/10 transition-colors"
                data-testid="edit-gst-btn"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pincode Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black">SERVICEABLE PINCODES</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-[#E10600] px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          data-testid="add-pincode-btn"
        >
          <Plus size={18} />
          <span>Add Pincode</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Total Pincodes</p>
          <p className="text-2xl font-black">{stats.total}</p>
        </div>
        <div className="bg-green-500/10 p-4 border border-green-500/30">
          <p className="text-green-500 text-sm">COD Enabled</p>
          <p className="text-2xl font-black text-green-500">{stats.codEnabled}</p>
        </div>
        <div className="bg-blue-500/10 p-4 border border-blue-500/30">
          <p className="text-blue-500 text-sm">Free Shipping</p>
          <p className="text-2xl font-black text-blue-500">{stats.freeShipping}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search pincode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 focus:outline-none focus:border-[#E10600]"
          data-testid="search-pincode-input"
        />
      </div>

      {/* Pincodes Table */}
      <div className="bg-white/5 border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">PINCODE</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">SHIPPING CHARGE</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-400">COD</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody data-testid="pincodes-table">
              {filteredPincodes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                    <MapPin size={48} className="mx-auto mb-4 text-gray-600" />
                    <p>No pincodes found</p>
                  </td>
                </tr>
              ) : (
                filteredPincodes.map((pincode) => (
                  <tr 
                    key={pincode.pincode} 
                    className="border-b border-white/5 hover:bg-white/5"
                    data-testid={`pincode-row-${pincode.pincode}`}
                  >
                    <td className="px-4 py-3 font-bold">{pincode.pincode}</td>
                    <td className="px-4 py-3">
                      {pincode.shipping_charge === 0 ? (
                        <span className="text-green-500 font-bold">FREE</span>
                      ) : (
                        formatPrice(pincode.shipping_charge)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {pincode.cod_available ? (
                        <span className="flex items-center space-x-1 text-green-500">
                          <Check size={16} />
                          <span>Available</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-red-500">
                          <XCircle size={16} />
                          <span>Not Available</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openModal(pincode)}
                          className="bg-white/5 p-2 hover:bg-white/10 transition-colors"
                          data-testid={`edit-pincode-btn-${pincode.pincode}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(pincode.pincode)}
                          className="bg-red-500/20 text-red-500 p-2 hover:bg-red-500/30 transition-colors"
                          data-testid={`delete-pincode-btn-${pincode.pincode}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pincode Modal */}
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
              <h2 className="text-xl font-black mb-4">
                {editingPincode ? 'EDIT PINCODE' : 'ADD PINCODE'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="110001"
                    maxLength="6"
                    disabled={editingPincode}
                    data-testid="pincode-input"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Shipping Charge (₹) *</label>
                  <input
                    type="number"
                    value={formData.shipping_charge}
                    onChange={(e) => setFormData({ ...formData, shipping_charge: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="99"
                    min="0"
                    data-testid="shipping-charge-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter 0 for free shipping</p>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.cod_available}
                      onChange={(e) => setFormData({ ...formData, cod_available: e.target.checked })}
                      className="w-5 h-5 accent-[#E10600]"
                      data-testid="cod-checkbox"
                    />
                    <span className="font-bold">Cash on Delivery Available</span>
                  </label>
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
                    data-testid="save-pincode-btn"
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
              <h2 className="text-xl font-black mb-2">DELETE PINCODE?</h2>
              <p className="text-gray-400 mb-6">Pincode {deleteConfirm} will no longer be serviceable.</p>
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
                  data-testid="confirm-delete-pincode-btn"
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

export default AdminPincode;
