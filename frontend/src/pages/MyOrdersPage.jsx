import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Loader2, ShoppingBag, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { toast } from 'sonner';

const formatPrice = (price) => {
  return `₹${price?.toLocaleString('en-IN') || 0}`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case 'confirmed':
      return <CheckCircle className="w-5 h-5 text-blue-500" />;
    case 'shipped':
      return <Truck className="w-5 h-5 text-purple-500" />;
    case 'delivered':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'cancelled':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Package className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
    case 'confirmed':
      return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    case 'shipped':
      return 'bg-purple-500/20 text-purple-500 border-purple-500/50';
    case 'delivered':
      return 'bg-green-500/20 text-green-500 border-green-500/50';
    case 'cancelled':
      return 'bg-red-500/20 text-red-500 border-red-500/50';
    default:
      return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
  }
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getMy();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={80} className="mx-auto mb-6 text-gray-600" />
          <h2 className="text-3xl font-black mb-4">NO ORDERS YET</h2>
          <p className="text-gray-400 mb-8">Start shopping to see your orders here</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-[#E10600] text-white px-8 py-4 font-black hover:bg-white hover:text-black transition-colors"
            data-testid="shop-now-btn"
          >
            SHOP NOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 
          className="text-4xl md:text-6xl font-black mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          MY <span className="text-[#E10600]">ORDERS</span>
        </motion.h1>

        <div className="space-y-4" data-testid="orders-list">
          {orders.map((order, index) => (
            <motion.div
              key={order.order_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 border border-white/10 overflow-hidden"
              data-testid={`order-${order.order_id}`}
            >
              {/* Order Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setSelectedOrder(selectedOrder === order.order_id ? null : order.order_id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.order_status)}
                    <span className={`text-xs px-2 py-1 border uppercase font-bold ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{order.order_id}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-bold text-[#E10600]">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-400">{order.items?.length || 0} item(s)</p>
                  </div>
                  <ChevronRight 
                    size={20} 
                    className={`transition-transform ${selectedOrder === order.order_id ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              {/* Order Details */}
              {selectedOrder === order.order_id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-white/10 p-4 space-y-4"
                >
                  {/* Items */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-400">ORDER ITEMS</h3>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3 bg-white/5 p-3">
                        <img 
                          src={item.product_image || '/placeholder.jpg'} 
                          alt={item.product_title}
                          className="w-16 h-20 object-cover cursor-pointer"
                          onClick={() => navigate(`/product/${item.product_id}`)}
                        />
                        <div className="flex-1">
                          <p className="font-bold text-sm">{item.product_title}</p>
                          <p className="text-xs text-gray-400">Size: {item.size} | Qty: {item.quantity}</p>
                          <p className="text-sm font-bold">{formatPrice(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Payment Method</p>
                      <p className="font-bold uppercase">{order.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Payment Status</p>
                      <p className={`font-bold uppercase ${order.payment_status === 'success' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {order.payment_status}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Subtotal</p>
                      <p className="font-bold">{formatPrice(order.subtotal)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Shipping</p>
                      <p className="font-bold">{order.shipping_charge === 0 ? 'FREE' : formatPrice(order.shipping_charge)}</p>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.tracking_id && (
                    <div className="bg-[#E10600]/10 border border-[#E10600]/30 p-3">
                      <p className="text-xs text-gray-400 mb-1">TRACKING DETAILS</p>
                      <p className="font-bold">Tracking ID: {order.tracking_id}</p>
                      {order.courier && <p className="text-sm text-gray-400">Courier: {order.courier}</p>}
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div>
                    <p className="text-gray-400 text-xs mb-1">DELIVERY ADDRESS</p>
                    <p className="text-sm">
                      {order.delivery_address?.name}<br />
                      {order.delivery_address?.addressLine1}<br />
                      {order.delivery_address?.addressLine2 && <>{order.delivery_address.addressLine2}<br /></>}
                      {order.delivery_address?.city}, {order.delivery_address?.state} - {order.pincode}<br />
                      Phone: {order.delivery_address?.phone}
                    </p>
                  </div>

                  {/* Actions */}
                  {order.order_status === 'delivered' && order.return_status === 'none' && (
                    <div className="pt-2 border-t border-white/10">
                      <button
                        className="text-sm text-[#E10600] hover:underline font-bold"
                        onClick={() => toast.info('Return/Replace feature coming soon!')}
                        data-testid={`return-btn-${order.order_id}`}
                      >
                        Request Return/Replacement
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;
