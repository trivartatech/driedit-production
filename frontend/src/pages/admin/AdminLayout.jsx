import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Package, ShoppingBag, Tag, MapPin, DollarSign, Image, Bell, LayoutDashboard } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';
import AdminPincode from './AdminPincode';
import AdminBanners from './AdminBanners';

const AdminLayout = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/categories', icon: Tag, label: 'Categories' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/admin/pincode', icon: MapPin, label: 'Pincode & GST' },
    { path: '/admin/banners', icon: Image, label: 'Banners' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/5 min-h-screen border-r border-white/10 sticky top-0">
          <div className="p-6">
            <h1 className="text-2xl font-black mb-8">
              <span className="text-[#E10600]">D</span>RIEDIT
              <span className="block text-sm text-gray-400 font-normal">Admin Panel</span>
            </h1>
            
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded transition-colors ${
                      isActive 
                        ? 'bg-[#E10600] text-white' 
                        : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-bold text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <Link
                to="/"
                className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-white/5 rounded transition-colors"
              >
                <span className="text-sm font-bold">← Back to Store</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/products" element={<AdminProducts />} />
            <Route path="/categories" element={<AdminCategories />} />
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/pincode" element={<AdminPincode />} />
            <Route path="/banners" element={<AdminBanners />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
