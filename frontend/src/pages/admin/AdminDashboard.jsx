import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, Package } from 'lucide-react';
import { ordersAPI, productsAPI, returnsAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingReturns: 0,
    lowStockProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes, returnsRes] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll({ limit: 1000 }),
        returnsAPI.getAll({ status: 'requested' })
      ]);

      const orders = ordersRes.data;
      const products = productsRes.data;
      const returns = returnsRes.data;

      const revenue = orders
        .filter(o => o.payment_status === 'success')
        .reduce((acc, o) => acc + o.total, 0);

      const lowStock = products.filter(p => p.stock < 10).length;

      setStats({
        totalRevenue: revenue,
        totalOrders: orders.length,
        pendingReturns: returns.length,
        lowStockProducts: lowStock
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: DollarSign, label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: 'text-green-500' },
    { icon: ShoppingBag, label: 'Total Orders', value: stats.totalOrders, color: 'text-blue-500' },
    { icon: AlertTriangle, label: 'Pending Returns', value: stats.pendingReturns, color: 'text-yellow-500' },
    { icon: Package, label: 'Low Stock Products', value: stats.lowStockProducts, color: 'text-red-500' }
  ];

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E10600] mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-black mb-8">DASHBOARD</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white/5 p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Icon className={stat.color} size={32} />
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-black">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white/5 p-6 border border-white/10">
        <h2 className="text-2xl font-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/products" className="bg-[#E10600] text-white p-4 text-center font-bold hover:bg-white hover:text-black transition-colors">
            Manage Products
          </a>
          <a href="/admin/orders" className="bg-white/10 text-white p-4 text-center font-bold hover:bg-[#E10600] transition-colors">
            View Orders
          </a>
          <a href="/admin/banners" className="bg-white/10 text-white p-4 text-center font-bold hover:bg-[#E10600] transition-colors">
            Update Banners
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;