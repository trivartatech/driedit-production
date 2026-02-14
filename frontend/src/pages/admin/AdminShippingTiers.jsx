import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Loader2, Truck, 
  ToggleLeft, ToggleRight, X, Info, AlertCircle
} from 'lucide-react';
import { shippingAPI } from '../../services/api';
import { toast } from 'sonner';

const formatPrice = (price) => `₹${price?.toLocaleString('en-IN') || 0}`;

const INITIAL_TIER = {
  min_amount: '',
  max_amount: '',
  shipping_charge: '',
  is_active: true
};

const AdminShippingTiers = () => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState(INITIAL_TIER);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const response = await shippingAPI.getAll();
      setTiers(response.data || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast.error('Failed to load shipping tiers');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (tier = null) => {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        min_amount: tier.min_amount,
        max_amount: tier.max_amount || '',
        shipping_charge: tier.shipping_charge,
        is_active: tier.is_active
      });
    } else {
      setEditingTier(null);
      setFormData(INITIAL_TIER);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTier(null);
    setFormData(INITIAL_TIER);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.min_amount === '' || formData.shipping_charge === '') {
      toast.error('Please fill required fields');
      return;
    }

    const minAmount = parseFloat(formData.min_amount);
    const maxAmount = formData.max_amount !== '' ? parseFloat(formData.max_amount) : null;
    const shippingCharge = parseFloat(formData.shipping_charge);

    if (minAmount < 0 || shippingCharge < 0) {
      toast.error('Values cannot be negative');
      return;
    }

    if (maxAmount !== null && maxAmount <= minAmount) {
      toast.error('Max amount must be greater than min amount');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        min_amount: minAmount,
        max_amount: maxAmount,
        shipping_charge: shippingCharge,
        is_active: formData.is_active
      };

      if (editingTier) {
        await shippingAPI.update(editingTier.tier_id, payload);
        toast.success('Shipping tier updated');
      } else {
        await shippingAPI.create(payload);
        toast.success('Shipping tier created');
      }

      closeModal();
      fetchTiers();
    } catch (error) {
      console.error('Error saving tier:', error);
      toast.error(error.response?.data?.detail || 'Failed to save shipping tier');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tier) => {
    try {
      await shippingAPI.toggle(tier.tier_id);
      toast.success(`Tier ${tier.is_active ? 'deactivated' : 'activated'}`);
      fetchTiers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update tier status');
    }
  };

  const handleDelete = async (tierId) => {
    try {
      await shippingAPI.delete(tierId);
      toast.success('Shipping tier deleted');
      setDeleteConfirm(null);
      fetchTiers();
    } catch (error) {
      toast.error('Failed to delete shipping tier');
    }
  };

  // Summary stats
  const activeTiers = tiers.filter(t => t.is_active).length;
  const freeShippingTier = tiers.find(t => t.is_active && t.shipping_charge === 0);

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
        <h1 className="text-4xl font-black">SHIPPING TIERS</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-[#E10600] px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          data-testid="add-tier-btn"
        >
          <Plus size={18} />
          <span>Add Tier</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 p-4 mb-6 flex items-start space-x-3">
        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-bold text-blue-400 mb-1">Tier-Based Shipping</p>
          <p className="text-gray-400">
            Shipping is calculated based on <strong className="text-white">subtotal before GST</strong>. 
            Create tiers to offer free shipping on higher orders or charge flat rates for different order values.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Tiers</p>
              <p className="text-3xl font-black text-[#E10600]">{activeTiers}</p>
            </div>
            <Truck className="text-[#E10600]" size={32} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Free Shipping Threshold</p>
              <p className="text-3xl font-black text-green-500">
                {freeShippingTier ? formatPrice(freeShippingTier.min_amount) : 'Not Set'}
              </p>
            </div>
            <Truck className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Tiers Table */}
      <div className="bg-white/5 border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="p-4 text-sm text-gray-400 font-bold">ORDER RANGE</th>
              <th className="p-4 text-sm text-gray-400 font-bold">SHIPPING CHARGE</th>
              <th className="p-4 text-sm text-gray-400 font-bold">STATUS</th>
              <th className="p-4 text-sm text-gray-400 font-bold">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  <Truck size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No shipping tiers configured</p>
                  <p className="text-sm mt-1">Add tiers to enable shipping calculation</p>
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr 
                  key={tier.tier_id} 
                  className="border-b border-white/5 hover:bg-white/5"
                  data-testid={`tier-row-${tier.tier_id}`}
                >
                  <td className="p-4">
                    <span className="font-bold">
                      {formatPrice(tier.min_amount)}
                      {tier.max_amount ? ` - ${formatPrice(tier.max_amount)}` : '+'}
                    </span>
                    {!tier.max_amount && (
                      <span className="text-xs text-gray-400 block">No upper limit</span>
                    )}
                  </td>
                  <td className="p-4">
                    {tier.shipping_charge === 0 ? (
                      <span className="text-green-500 font-bold">FREE</span>
                    ) : (
                      <span className="font-bold">{formatPrice(tier.shipping_charge)}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {tier.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 border border-green-500/30">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 border border-red-500/30">
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggle(tier)}
                        className="p-2 hover:bg-white/10 transition-colors"
                        title={tier.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {tier.is_active ? (
                          <ToggleRight size={20} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={20} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => openModal(tier)}
                        className="p-2 hover:bg-white/10 transition-colors"
                        data-testid={`edit-tier-btn-${tier.tier_id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(tier.tier_id)}
                        className="p-2 hover:bg-red-500/20 text-red-500 transition-colors"
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

      {/* Example Banner */}
      {tiers.length === 0 && (
        <div className="mt-6 bg-white/5 border border-white/10 p-4">
          <p className="font-bold mb-2">Example Configuration:</p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• ₹0 - ₹499: Shipping ₹80</p>
            <p>• ₹500 - ₹999: Shipping ₹50</p>
            <p>• ₹1000+: FREE shipping</p>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
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
                <h2 className="text-2xl font-black">
                  {editingTier ? 'EDIT TIER' : 'ADD TIER'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Amount (₹) *</label>
                    <input
                      type="number"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="0"
                      min="0"
                      data-testid="tier-min-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="No limit"
                      min="0"
                      data-testid="tier-max-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Shipping Charge (₹) *</label>
                  <input
                    type="number"
                    value={formData.shipping_charge}
                    onChange={(e) => setFormData({ ...formData, shipping_charge: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="0 for free shipping"
                    min="0"
                    data-testid="tier-shipping-input"
                  />
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#E10600]"
                  />
                  <span className="text-sm">Active</span>
                </label>

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
                    data-testid="save-tier-btn"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}
                    <span>{saving ? 'Saving...' : (editingTier ? 'Update' : 'Create')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
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
              <h2 className="text-xl font-black mb-2">DELETE TIER?</h2>
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

export default AdminShippingTiers;
