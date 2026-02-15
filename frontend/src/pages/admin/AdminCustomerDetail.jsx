import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, 
  ShoppingBag, IndianRupee, Package, RefreshCw, 
  CreditCard, Banknote, CheckCircle, XCircle, Clock,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import { customersAPI } from '../../services/api';

const AdminCustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchCustomerDetail();
  }, [customerId]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const response = await customersAPI.getById(customerId);
      setCustomer(response.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer details');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!customer) return;
    
    setUpdatingStatus(true);
    try {
      const newStatus = !customer.profile.is_active;
      await customersAPI.updateStatus(customerId, newStatus);
      setCustomer(prev => ({
        ...prev,
        profile: { ...prev.profile, is_active: newStatus }
      }));
      toast.success(`Customer ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update customer status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      shipped: 'bg-purple-500/20 text-purple-400',
      delivered: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      requested: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E10600] mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const { profile, orders, returns, financial_summary, return_summary } = customer;

  return (
    <div data-testid="customer-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/customers')}
          className="p-2 bg-white/5 rounded hover:bg-white/10 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black">{profile.name}</h1>
          <p className="text-gray-400">Customer since {formatDate(profile.created_at)}</p>
        </div>
        
        {/* Status Toggle */}
        <button
          onClick={handleStatusToggle}
          disabled={updatingStatus}
          className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-colors ${
            profile.is_active 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
          data-testid="status-toggle-btn"
        >
          {profile.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {updatingStatus ? 'Updating...' : profile.is_active ? 'Active' : 'Inactive'}
        </button>
      </div>

      {/* Profile & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Info */}
        <div className="bg-white/5 rounded-lg p-6" data-testid="profile-card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User size={18} className="text-[#E10600]" />
            Profile Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <span>{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <span>{profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">
                Joined {formatDate(profile.created_at)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <span className="text-sm text-gray-400">Auth Provider: </span>
              <span className="text-sm font-bold capitalize">{profile.auth_provider}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white/5 rounded-lg p-6" data-testid="financial-card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <IndianRupee size={18} className="text-[#E10600]" />
            Financial Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-black text-[#E10600]">
                {formatCurrency(financial_summary.total_spend)}
              </p>
              <p className="text-sm text-gray-400">Total Spend</p>
            </div>
            <div>
              <p className="text-2xl font-black">{financial_summary.total_orders}</p>
              <p className="text-sm text-gray-400">Total Orders</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(financial_summary.avg_order_value)}</p>
              <p className="text-sm text-gray-400">Avg Order Value</p>
            </div>
            <div>
              <p className="text-lg font-bold">{financial_summary.total_items}</p>
              <p className="text-sm text-gray-400">Items Purchased</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-blue-400" />
              <span>{financial_summary.online_orders} Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Banknote size={14} className="text-green-400" />
              <span>{financial_summary.cod_orders} COD</span>
            </div>
          </div>
        </div>

        {/* Return Summary */}
        <div className="bg-white/5 rounded-lg p-6" data-testid="returns-card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <RefreshCw size={18} className="text-[#E10600]" />
            Return Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-black">{return_summary.total_returns}</p>
              <p className="text-sm text-gray-400">Total Returns</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-400">{return_summary.pending}</p>
              <p className="text-sm text-gray-400">Pending</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-400">{return_summary.completed}</p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{return_summary.rejected}</p>
              <p className="text-sm text-gray-400">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Addresses */}
      {profile.addresses && profile.addresses.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6 mb-8" data-testid="addresses-section">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-[#E10600]" />
            Saved Addresses ({profile.addresses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.addresses.map((address, idx) => (
              <div 
                key={address.address_id || idx} 
                className={`p-4 rounded border ${
                  address.is_default 
                    ? 'border-[#E10600] bg-[#E10600]/10' 
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">{address.label}</span>
                  {address.is_default && (
                    <span className="text-xs bg-[#E10600] px-2 py-0.5 rounded">Default</span>
                  )}
                </div>
                <p className="text-sm">{address.name}</p>
                <p className="text-sm text-gray-400">{address.phone}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                </p>
                <p className="text-sm text-gray-400">
                  {address.city}, {address.state} - {address.pincode}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-2 font-bold transition-colors ${
            activeTab === 'orders' 
              ? 'text-[#E10600] border-b-2 border-[#E10600]' 
              : 'text-gray-400 hover:text-white'
          }`}
          data-testid="orders-tab"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag size={18} />
            Orders ({orders.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 px-2 font-bold transition-colors ${
            activeTab === 'returns' 
              ? 'text-[#E10600] border-b-2 border-[#E10600]' 
              : 'text-gray-400 hover:text-white'
          }`}
          data-testid="returns-tab"
        >
          <span className="flex items-center gap-2">
            <RefreshCw size={18} />
            Returns ({returns.length})
          </span>
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white/5 rounded-lg overflow-hidden" data-testid="orders-list">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-sm">Order ID</th>
                    <th className="text-left px-4 py-3 font-bold text-sm">Date</th>
                    <th className="text-center px-4 py-3 font-bold text-sm">Items</th>
                    <th className="text-right px-4 py-3 font-bold text-sm">Total</th>
                    <th className="text-center px-4 py-3 font-bold text-sm">Payment</th>
                    <th className="text-center px-4 py-3 font-bold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {orders.map((order) => (
                    <tr 
                      key={order.order_id} 
                      className="hover:bg-white/5 cursor-pointer"
                      onClick={() => navigate(`/admin/orders?search=${order.order_id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{order.order_id.slice(0, 12)}...</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          order.payment_status === 'success' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {order.payment_status === 'success' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {order.payment_method?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${getStatusColor(order.order_status)}`}>
                          {order.order_status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="bg-white/5 rounded-lg overflow-hidden" data-testid="returns-list">
          {returns.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw size={48} className="mx-auto mb-4 opacity-50" />
              <p>No return requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-sm">Return ID</th>
                    <th className="text-left px-4 py-3 font-bold text-sm">Order ID</th>
                    <th className="text-left px-4 py-3 font-bold text-sm">Reason</th>
                    <th className="text-left px-4 py-3 font-bold text-sm">Date</th>
                    <th className="text-center px-4 py-3 font-bold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {returns.map((ret) => (
                    <tr key={ret.return_id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{ret.return_id?.slice(0, 12)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-400">{ret.order_id?.slice(0, 12)}...</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {ret.reason}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {formatDate(ret.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${getStatusColor(ret.status)}`}>
                          {ret.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCustomerDetail;
