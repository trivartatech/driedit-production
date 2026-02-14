import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Search, Loader2, Tag, 
  ToggleLeft, ToggleRight, X, Percent, DollarSign,
  Users, TrendingUp, Calendar, AlertCircle, Zap
} from 'lucide-react';
import { couponsAPI } from '../../services/api';
import { toast } from 'sonner';

const formatPrice = (price) => `₹${price?.toLocaleString('en-IN') || 0}`;
const formatDate = (dateString) => {
  if (!dateString) return 'No expiry';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const INITIAL_COUPON = {
  code: '',
  coupon_type: 'percentage',
  discount_value: '',
  min_order_value: '',
  max_discount: '',
  usage_limit: '',
  one_time_per_user: true,
  auto_apply: false,
  is_active: true,
  expires_at: ''
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(INITIAL_COUPON);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await couponsAPI.getAll(true);
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        coupon_type: coupon.coupon_type,
        discount_value: coupon.discount_value,
        min_order_value: coupon.min_order_value || '',
        max_discount: coupon.max_discount || '',
        usage_limit: coupon.usage_limit || '',
        one_time_per_user: coupon.one_time_per_user,
        auto_apply: coupon.auto_apply || false,
        is_active: coupon.is_active,
        expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingCoupon(null);
      setFormData(INITIAL_COUPON);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
    setFormData(INITIAL_COUPON);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discount_value) {
      toast.error('Please fill required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        coupon_type: formData.coupon_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        one_time_per_user: formData.one_time_per_user,
        is_active: formData.is_active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      };

      if (editingCoupon) {
        await couponsAPI.update(editingCoupon.coupon_id, payload);
        toast.success('Coupon updated successfully');
      } else {
        await couponsAPI.create(payload);
        toast.success('Coupon created successfully');
      }

      closeModal();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.detail || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await couponsAPI.toggle(coupon.coupon_id);
      toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`);
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDelete = async (couponId) => {
    try {
      await couponsAPI.delete(couponId);
      toast.success('Coupon deleted');
      setDeleteConfirm(null);
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const viewDetails = async (couponId) => {
    try {
      const response = await couponsAPI.getOne(couponId);
      setDetailsModal(response.data);
    } catch (error) {
      toast.error('Failed to load coupon details');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const activeCoupons = coupons.filter(c => c.is_active && !c.is_expired).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.redemption_count || 0), 0);
  const totalDiscount = coupons.reduce((sum, c) => sum + (c.total_discount_given || 0), 0);

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
        <h1 className="text-4xl font-black">COUPONS</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-[#E10600] px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          data-testid="add-coupon-btn"
        >
          <Plus size={18} />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Coupons</p>
              <p className="text-3xl font-black text-[#E10600]">{activeCoupons}</p>
            </div>
            <Tag className="text-[#E10600]" size={32} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Redemptions</p>
              <p className="text-3xl font-black">{totalRedemptions}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Discount Given</p>
              <p className="text-3xl font-black text-green-500">{formatPrice(totalDiscount)}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 focus:outline-none focus:border-[#E10600]"
          data-testid="search-coupons-input"
        />
      </div>

      {/* Coupons Table */}
      <div className="bg-white/5 border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="p-4 text-sm text-gray-400 font-bold">CODE</th>
              <th className="p-4 text-sm text-gray-400 font-bold">TYPE</th>
              <th className="p-4 text-sm text-gray-400 font-bold">DISCOUNT</th>
              <th className="p-4 text-sm text-gray-400 font-bold">USAGE</th>
              <th className="p-4 text-sm text-gray-400 font-bold">STATUS</th>
              <th className="p-4 text-sm text-gray-400 font-bold">EXPIRES</th>
              <th className="p-4 text-sm text-gray-400 font-bold">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  <Tag size={40} className="mx-auto mb-3 opacity-50" />
                  No coupons found
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => (
                <tr 
                  key={coupon.coupon_id} 
                  className="border-b border-white/5 hover:bg-white/5"
                  data-testid={`coupon-row-${coupon.coupon_id}`}
                >
                  <td className="p-4">
                    <button 
                      onClick={() => viewDetails(coupon.coupon_id)}
                      className="font-mono font-bold text-[#E10600] hover:underline"
                    >
                      {coupon.code}
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-sm">
                      {coupon.coupon_type === 'percentage' ? (
                        <><Percent size={14} /> Percentage</>
                      ) : (
                        <><DollarSign size={14} /> Fixed</>
                      )}
                    </span>
                  </td>
                  <td className="p-4 font-bold">
                    {coupon.coupon_type === 'percentage' 
                      ? `${coupon.discount_value}%`
                      : formatPrice(coupon.discount_value)
                    }
                    {coupon.max_discount && (
                      <span className="text-xs text-gray-400 block">
                        Max: {formatPrice(coupon.max_discount)}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm">
                      {coupon.used_count || 0}
                      {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      {formatPrice(coupon.total_discount_given || 0)} given
                    </span>
                  </td>
                  <td className="p-4">
                    {coupon.is_expired ? (
                      <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        EXPIRED
                      </span>
                    ) : coupon.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 border border-green-500/30">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 border border-red-500/30">
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {formatDate(coupon.expires_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggle(coupon)}
                        className="p-2 hover:bg-white/10 transition-colors"
                        title={coupon.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {coupon.is_active ? (
                          <ToggleRight size={20} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={20} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => openModal(coupon)}
                        className="p-2 hover:bg-white/10 transition-colors"
                        data-testid={`edit-coupon-btn-${coupon.coupon_id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(coupon.coupon_id)}
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

      {/* Create/Edit Modal */}
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
                <h2 className="text-2xl font-black">
                  {editingCoupon ? 'EDIT COUPON' : 'CREATE COUPON'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] font-mono"
                    placeholder="e.g., SAVE10"
                    data-testid="coupon-code-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Type *</label>
                    <select
                      value={formData.coupon_type}
                      onChange={(e) => setFormData({ ...formData, coupon_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      data-testid="coupon-type-select"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      {formData.coupon_type === 'percentage' ? 'Discount %' : 'Discount Amount'} *
                    </label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder={formData.coupon_type === 'percentage' ? '10' : '200'}
                      min="0"
                      max={formData.coupon_type === 'percentage' ? '100' : undefined}
                      data-testid="coupon-discount-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Order Value</label>
                    <input
                      type="number"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Max Discount {formData.coupon_type === 'percentage' && '(Cap)'}
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.one_time_per_user}
                      onChange={(e) => setFormData({ ...formData, one_time_per_user: e.target.checked })}
                      className="w-4 h-4 accent-[#E10600]"
                    />
                    <span className="text-sm">One-time per user</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-[#E10600]"
                    />
                    <span className="text-sm">Active</span>
                  </label>
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
                    data-testid="save-coupon-btn"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}
                    <span>{saving ? 'Saving...' : (editingCoupon ? 'Update' : 'Create')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {detailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setDetailsModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 w-full max-w-2xl my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black font-mono">{detailsModal.code}</h2>
                <button onClick={() => setDetailsModal(null)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4">
                  <p className="text-sm text-gray-400">Total Redemptions</p>
                  <p className="text-2xl font-black">{detailsModal.used_count || 0}</p>
                </div>
                <div className="bg-white/5 p-4">
                  <p className="text-sm text-gray-400">Total Discount Given</p>
                  <p className="text-2xl font-black text-green-500">{formatPrice(detailsModal.total_discount_given)}</p>
                </div>
              </div>

              <h3 className="font-bold mb-3">Usage History</h3>
              <div className="bg-white/5 max-h-64 overflow-y-auto">
                {detailsModal.usage_history?.length === 0 ? (
                  <p className="p-4 text-center text-gray-400">No usage yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#111]">
                      <tr className="border-b border-white/10">
                        <th className="p-3 text-left text-gray-400">User</th>
                        <th className="p-3 text-left text-gray-400">Order</th>
                        <th className="p-3 text-left text-gray-400">Discount</th>
                        <th className="p-3 text-left text-gray-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsModal.usage_history?.map((usage, idx) => (
                        <tr key={idx} className="border-b border-white/5">
                          <td className="p-3">{usage.user_email || usage.user_id}</td>
                          <td className="p-3 font-mono text-xs">{usage.order_id}</td>
                          <td className="p-3 text-green-500">{formatPrice(usage.discount_amount)}</td>
                          <td className="p-3 text-gray-400">{formatDate(usage.used_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
              <h2 className="text-xl font-black mb-2">DELETE COUPON?</h2>
              <p className="text-gray-400 mb-6">This will also delete all usage history.</p>
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

export default AdminCoupons;
