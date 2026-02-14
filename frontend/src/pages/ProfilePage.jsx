import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Loader2, ArrowLeft, Plus, Pencil, Trash2, 
  Check, Star, Phone, Home, Briefcase, Building
} from 'lucide-react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const LABEL_ICONS = {
  Home: Home,
  Work: Briefcase,
  Other: Building
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [maxAddresses, setMaxAddresses] = useState(5);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.get();
      const data = response.data;
      
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || ''
      });
      
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await profileAPI.getAddresses();
      setAddresses(response.data.addresses || []);
      setMaxAddresses(response.data.max_allowed || 5);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updateData = {};
      if (profile.name !== user?.name) updateData.name = profile.name;
      if (profile.phone !== user?.phone) updateData.phone = profile.phone || null;
      
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }
      
      const response = await profileAPI.update(updateData);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      name: profile.name || '',
      phone: profile.phone || '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      is_default: addresses.length === 0
    });
    setEditingAddress(null);
  };

  const openAddModal = () => {
    if (addresses.length >= maxAddresses) {
      toast.error(`You can save up to ${maxAddresses} addresses.`);
      return;
    }
    resetAddressForm();
    setShowAddressModal(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label || 'Home',
      name: address.name || '',
      phone: address.phone || '',
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      is_default: address.is_default || false
    });
    setShowAddressModal(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingAddress) {
        await profileAPI.updateAddress(editingAddress.address_id, addressForm);
        toast.success('Address updated successfully');
      } else {
        await profileAPI.addAddress(addressForm);
        toast.success('Address added successfully');
      }
      
      await loadAddresses();
      setShowAddressModal(false);
      resetAddressForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await profileAPI.deleteAddress(addressId);
      toast.success('Address deleted');
      await loadAddresses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await profileAPI.setDefaultAddress(addressId);
      toast.success('Default address updated');
      await loadAddresses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update default');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-4xl font-black mb-8">MY ACCOUNT</h1>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-bold text-sm transition-colors relative ${
              activeTab === 'profile' 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            data-testid="profile-tab"
          >
            <span className="flex items-center space-x-2">
              <User size={18} />
              <span>Profile Info</span>
            </span>
            {activeTab === 'profile' && (
              <motion.div 
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E10600]"
              />
            )}
          </button>
          <button
            onClick={() => { setActiveTab('addresses'); loadAddresses(); }}
            className={`px-6 py-3 font-bold text-sm transition-colors relative ${
              activeTab === 'addresses' 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            data-testid="addresses-tab"
          >
            <span className="flex items-center space-x-2">
              <MapPin size={18} />
              <span>Saved Addresses</span>
              {addresses.length > 0 && (
                <span className="bg-white/10 px-2 py-0.5 text-xs">{addresses.length}</span>
              )}
            </span>
            {activeTab === 'addresses' && (
              <motion.div 
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E10600]"
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-6">
                  <h2 className="text-xl font-bold mb-6">Personal Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                        placeholder="Your name"
                        data-testid="profile-name-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full bg-white/5 border border-white/10 p-3 text-gray-400 cursor-not-allowed"
                        data-testid="profile-email-input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full bg-white/5 border border-white/10 p-3 pl-10 focus:outline-none focus:border-[#E10600]"
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          data-testid="profile-phone-input"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Indian mobile number (10 digits)</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-[#E10600] text-white px-8 py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  data-testid="save-profile-btn"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>SAVE CHANGES</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'addresses' && (
            <motion.div
              key="addresses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Add Address Button */}
              <button
                onClick={openAddModal}
                disabled={addresses.length >= maxAddresses}
                className="w-full bg-white/5 border border-dashed border-white/20 p-4 mb-6 hover:border-[#E10600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                data-testid="add-address-btn"
              >
                <Plus size={20} />
                <span className="font-bold">ADD NEW ADDRESS</span>
                <span className="text-sm text-gray-400">({addresses.length}/{maxAddresses})</span>
              </button>

              {/* Addresses List */}
              {addresses.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No saved addresses yet</p>
                  <p className="text-sm">Add an address for faster checkout</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => {
                    const LabelIcon = LABEL_ICONS[address.label] || Building;
                    return (
                      <div
                        key={address.address_id}
                        className={`bg-white/5 border p-4 relative ${
                          address.is_default ? 'border-[#E10600]' : 'border-white/10'
                        }`}
                        data-testid={`address-card-${address.address_id}`}
                      >
                        {address.is_default && (
                          <div className="absolute top-0 right-0 bg-[#E10600] text-xs px-2 py-1 font-bold flex items-center space-x-1">
                            <Star size={12} />
                            <span>DEFAULT</span>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <LabelIcon size={16} className="text-gray-400" />
                              <span className="font-bold text-sm uppercase">{address.label}</span>
                            </div>
                            
                            <p className="font-bold">{address.name}</p>
                            <p className="text-gray-400 text-sm">{address.phone}</p>
                            <p className="text-sm mt-2">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-sm text-gray-400">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!address.is_default && (
                              <button
                                onClick={() => handleSetDefault(address.address_id)}
                                className="text-gray-400 hover:text-[#E10600] p-2 text-xs underline"
                                data-testid={`set-default-${address.address_id}`}
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(address)}
                              className="text-gray-400 hover:text-white p-2"
                              data-testid={`edit-address-${address.address_id}`}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.address_id)}
                              className="text-gray-400 hover:text-[#E10600] p-2"
                              data-testid={`delete-address-${address.address_id}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address Modal */}
        <AnimatePresence>
          {showAddressModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddressModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                data-testid="address-modal"
              >
                <div className="p-6">
                  <h3 className="text-xl font-black mb-6">
                    {editingAddress ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}
                  </h3>
                  
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    {/* Label Selection */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Address Type</label>
                      <div className="flex space-x-2">
                        {['Home', 'Work', 'Other'].map((label) => {
                          const Icon = LABEL_ICONS[label];
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setAddressForm({ ...addressForm, label })}
                              className={`flex-1 py-2 px-3 border text-sm font-bold flex items-center justify-center space-x-2 transition-colors ${
                                addressForm.label === label
                                  ? 'bg-[#E10600] border-[#E10600] text-white'
                                  : 'bg-white/5 border-white/10 hover:border-white/30'
                              }`}
                              data-testid={`label-${label.toLowerCase()}`}
                            >
                              <Icon size={16} />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Name *</label>
                        <input
                          type="text"
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          required
                          className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                          placeholder="Full name"
                          data-testid="modal-name-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Phone *</label>
                        <input
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          required
                          maxLength={10}
                          className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                          placeholder="10-digit number"
                          data-testid="modal-phone-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Address Line 1 *</label>
                      <input
                        type="text"
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                        required
                        className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                        placeholder="House/Flat no., Building, Street"
                        data-testid="modal-address1-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Address Line 2</label>
                      <input
                        type="text"
                        value={addressForm.address_line2}
                        onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                        placeholder="Landmark, Area (Optional)"
                        data-testid="modal-address2-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">City *</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                          className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                          placeholder="City"
                          data-testid="modal-city-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">State *</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          required
                          className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                          placeholder="State"
                          data-testid="modal-state-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Pincode *</label>
                      <input
                        type="text"
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        required
                        maxLength={6}
                        className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                        placeholder="6-digit pincode"
                        data-testid="modal-pincode-input"
                      />
                    </div>

                    {!editingAddress && addresses.length > 0 && (
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="w-4 h-4 accent-[#E10600]"
                          data-testid="modal-default-checkbox"
                        />
                        <span className="text-sm">Set as default address</span>
                      </label>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(false)}
                        className="flex-1 border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
                        data-testid="modal-cancel-btn"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-[#E10600] py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        data-testid="modal-save-btn"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>SAVING...</span>
                          </>
                        ) : (
                          <span>{editingAddress ? 'UPDATE' : 'SAVE'} ADDRESS</span>
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
    </div>
  );
};

export default ProfilePage;
