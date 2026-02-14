import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Package, DollarSign, Users, 
  TrendingUp, AlertTriangle, Loader2, ArrowRight
} from 'lucide-react';
import { ordersAPI, productsAPI } from '../../services/api';

const formatPrice = (price) => `₹${price?.toLocaleString('en-IN') || 0}`;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: []
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        ordersAPI.getAll({ limit: 100 }),
        productsAPI.getAll({})
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      // Calculate stats
      const totalRevenue = orders
        .filter(o => o.payment_status === 'success')
        .reduce((sum, o) => sum + o.total, 0);

      const pendingOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed').length;

      const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue,
        totalProducts: products.length,
        lowStockProducts
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      <h1 className="text-4xl font-black mb-8">DASHBOARD</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#E10600] p-3">
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-gray-400 text-sm">Total Revenue</p>
          <p className="text-3xl font-black text-[#E10600]">{formatPrice(stats.totalRevenue)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Total Orders</p>
          <p className="text-3xl font-black">{stats.totalOrders}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-yellow-500/10 p-6 border border-yellow-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-500 p-3 text-black">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-yellow-500 text-sm">Pending Orders</p>
          <p className="text-3xl font-black text-yellow-500">{stats.pendingOrders}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500 p-3">
              <Package size={24} />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Total Products</p>
          <p className="text-3xl font-black">{stats.totalProducts}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">RECENT ORDERS</h2>
            <Link to="/admin/orders" className="text-[#E10600] text-sm font-bold flex items-center space-x-1 hover:underline">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.order_id} 
                  className="flex items-center justify-between bg-white/5 p-3"
                >
                  <div>
                    <p className="font-bold text-sm">{order.order_id}</p>
                    <p className="text-xs text-gray-400">{order.delivery_address?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#E10600]">{formatPrice(order.total)}</p>
                    <span className={`text-xs px-2 py-0.5 uppercase font-bold ${
                      order.order_status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                      order.order_status === 'shipped' ? 'bg-purple-500/20 text-purple-500' :
                      order.order_status === 'confirmed' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black flex items-center space-x-2">
              <AlertTriangle className="text-yellow-500" size={20} />
              <span>LOW STOCK</span>
            </h2>
            <Link to="/admin/products" className="text-[#E10600] text-sm font-bold flex items-center space-x-1 hover:underline">
              <span>Manage</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">All products are well stocked!</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.slice(0, 5).map((product) => (
                <div 
                  key={product.product_id} 
                  className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={product.images?.[0] || '/placeholder.jpg'} 
                      alt={product.title}
                      className="w-10 h-12 object-cover"
                    />
                    <p className="font-bold text-sm truncate max-w-[150px]">{product.title}</p>
                  </div>
                  <span className="bg-yellow-500 text-black px-2 py-1 text-xs font-bold">
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link 
          to="/admin/orders" 
          className="bg-white/5 border border-white/10 p-4 text-center hover:bg-white/10 transition-colors"
        >
          <ShoppingBag size={24} className="mx-auto mb-2" />
          <p className="font-bold text-sm">Manage Orders</p>
        </Link>
        <Link 
          to="/admin/products" 
          className="bg-white/5 border border-white/10 p-4 text-center hover:bg-white/10 transition-colors"
        >
          <Package size={24} className="mx-auto mb-2" />
          <p className="font-bold text-sm">Manage Products</p>
        </Link>
        <Link 
          to="/admin/banners" 
          className="bg-white/5 border border-white/10 p-4 text-center hover:bg-white/10 transition-colors"
        >
          <TrendingUp size={24} className="mx-auto mb-2" />
          <p className="font-bold text-sm">Hero Banners</p>
        </Link>
        <Link 
          to="/admin/pincode" 
          className="bg-white/5 border border-white/10 p-4 text-center hover:bg-white/10 transition-colors"
        >
          <DollarSign size={24} className="mx-auto mb-2" />
          <p className="font-bold text-sm">GST & Shipping</p>
        </Link>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
