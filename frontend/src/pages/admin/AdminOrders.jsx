import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Truck, CheckCircle, XCircle, Clock, Eye, 
  ChevronDown, Search, Loader2, RefreshCw
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { toast } from 'sonner';

const formatPrice = (price) => `₹${price?.toLocaleString('en-IN') || 0}`;
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-500 border-blue-500/50' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-500/20 text-purple-500 border-purple-500/50' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/20 text-green-500 border-green-500/50' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-500 border-red-500/50' },
];

const getStatusColor = (status) => {
  const found = STATUS_OPTIONS.find(s => s.value === status);
  return found?.color || 'bg-gray-500/20 text-gray-500 border-gray-500/50';
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [trackingModal, setTrackingModal] = useState(null);
  const [trackingData, setTrackingData] = useState({ tracking_id: '', courier: '' });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await ordersAPI.getAll(params);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddTracking = async () => {
    if (!trackingData.tracking_id || !trackingData.courier) {
      toast.error('Please fill in tracking ID and courier name');
      return;
    }

    try {
      await ordersAPI.updateTracking(trackingModal, trackingData);
      toast.success('Tracking details added');
      setTrackingModal(null);
      setTrackingData({ tracking_id: '', courier: '' });
      fetchOrders();
    } catch (error) {
      console.error('Error adding tracking:', error);
      toast.error('Failed to add tracking details');
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.delivery_address?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    confirmed: orders.filter(o => o.order_status === 'confirmed').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
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
        <h1 className="text-4xl font-black">ORDERS</h1>
        <button 
          onClick={fetchOrders}
          className="flex items-center space-x-2 bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors"
          data-testid="refresh-orders-btn"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/5 p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Total Orders</p>
          <p className="text-3xl font-black">{stats.total}</p>
        </div>
        <div className="bg-yellow-500/10 p-4 border border-yellow-500/30">
          <p className="text-yellow-500 text-sm">Pending</p>
          <p className="text-3xl font-black text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-blue-500/10 p-4 border border-blue-500/30">
          <p className="text-blue-500 text-sm">Confirmed</p>
          <p className="text-3xl font-black text-blue-500">{stats.confirmed}</p>
        </div>
        <div className="bg-purple-500/10 p-4 border border-purple-500/30">
          <p className="text-purple-500 text-sm">Shipped</p>
          <p className="text-3xl font-black text-purple-500">{stats.shipped}</p>
        </div>
        <div className="bg-green-500/10 p-4 border border-green-500/30">
          <p className="text-green-500 text-sm">Delivered</p>
          <p className="text-3xl font-black text-green-500">{stats.delivered}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Order ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 focus:outline-none focus:border-[#E10600]"
            data-testid="search-orders-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-4 py-3 focus:outline-none focus:border-[#E10600] min-w-[180px]"
          data-testid="status-filter-select"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4" data-testid="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10">
            <Package size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order.order_id}
              layout
              className="bg-white/5 border border-white/10 overflow-hidden"
              data-testid={`order-row-${order.order_id}`}
            >
              {/* Order Header */}
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setSelectedOrder(selectedOrder === order.order_id ? null : order.order_id)}
              >
                <div className="flex items-center space-x-4 mb-2 md:mb-0">
                  <div>
                    <p className="font-bold text-sm">{order.order_id}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs px-2 py-1 border uppercase font-bold ${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                  <span className={`text-xs px-2 py-1 border ${order.payment_status === 'success' ? 'bg-green-500/20 text-green-500 border-green-500/50' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'}`}>
                    {order.payment_method.toUpperCase()} - {order.payment_status}
                  </span>
                  <span className="font-bold text-[#E10600]">{formatPrice(order.total)}</span>
                  <ChevronDown 
                    size={18} 
                    className={`transition-transform ${selectedOrder === order.order_id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {selectedOrder === order.order_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer & Address */}
                      <div>
                        <h3 className="font-bold text-sm text-gray-400 mb-2">CUSTOMER DETAILS</h3>
                        <div className="bg-white/5 p-3 text-sm">
                          <p className="font-bold">{order.delivery_address?.name}</p>
                          <p>{order.delivery_address?.phone}</p>
                          <p className="text-gray-400 mt-2">
                            {order.delivery_address?.addressLine1}<br />
                            {order.delivery_address?.addressLine2 && <>{order.delivery_address.addressLine2}<br /></>}
                            {order.delivery_address?.city}, {order.delivery_address?.state} - {order.pincode}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h3 className="font-bold text-sm text-gray-400 mb-2">ORDER ITEMS</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-3 bg-white/5 p-2">
                              <img 
                                src={item.product_image || '/placeholder.jpg'} 
                                alt={item.product_title}
                                className="w-12 h-14 object-cover"
                              />
                              <div className="flex-1 text-sm">
                                <p className="font-bold truncate">{item.product_title}</p>
                                <p className="text-gray-400">Size: {item.size} | Qty: {item.quantity}</p>
                              </div>
                              <p className="font-bold">{formatPrice(item.subtotal)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Subtotal</p>
                        <p className="font-bold">{formatPrice(order.subtotal)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">GST</p>
                        <p className="font-bold">{formatPrice(order.gst_amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Shipping</p>
                        <p className="font-bold">{order.shipping_charge === 0 ? 'FREE' : formatPrice(order.shipping_charge)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total</p>
                        <p className="font-bold text-[#E10600] text-lg">{formatPrice(order.total)}</p>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking_id && (
                      <div className="p-4 border-t border-white/10 bg-purple-500/10">
                        <div className="flex items-center space-x-2">
                          <Truck size={18} className="text-purple-500" />
                          <span className="text-sm">
                            <span className="font-bold">Tracking:</span> {order.tracking_id} 
                            {order.courier && <span className="text-gray-400"> ({order.courier})</span>}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="p-4 border-t border-white/10 flex flex-wrap gap-3">
                      {/* Status Update */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Update Status:</span>
                        <select
                          value={order.order_status}
                          onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                          disabled={updatingStatus === order.order_id}
                          className="bg-white/5 border border-white/10 px-3 py-1 text-sm focus:outline-none focus:border-[#E10600] disabled:opacity-50"
                          data-testid={`status-select-${order.order_id}`}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                        {updatingStatus === order.order_id && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                      </div>

                      {/* Add Tracking */}
                      {!order.tracking_id && order.order_status !== 'cancelled' && (
                        <button
                          onClick={() => setTrackingModal(order.order_id)}
                          className="bg-purple-500/20 text-purple-500 px-3 py-1 text-sm font-bold hover:bg-purple-500/30 transition-colors flex items-center space-x-1"
                          data-testid={`add-tracking-btn-${order.order_id}`}
                        >
                          <Truck size={14} />
                          <span>Add Tracking</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {trackingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setTrackingModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-black mb-4">ADD TRACKING DETAILS</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tracking ID</label>
                  <input
                    type="text"
                    value={trackingData.tracking_id}
                    onChange={(e) => setTrackingData({ ...trackingData, tracking_id: e.target.value })}
                    placeholder="e.g., AWB123456789"
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    data-testid="tracking-id-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Courier Name</label>
                  <input
                    type="text"
                    value={trackingData.courier}
                    onChange={(e) => setTrackingData({ ...trackingData, courier: e.target.value })}
                    placeholder="e.g., Delhivery, BlueDart"
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    data-testid="courier-name-input"
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setTrackingModal(null)}
                    className="flex-1 border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTracking}
                    className="flex-1 bg-[#E10600] py-3 font-bold hover:bg-white hover:text-black transition-colors"
                    data-testid="save-tracking-btn"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
