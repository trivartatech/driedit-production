import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Package, ShoppingBag, Tag, MapPin, Image, Bell, 
  LayoutDashboard, RefreshCw, ArrowLeft, Ticket, Truck
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';
import AdminPincode from './AdminPincode';
import AdminBanners from './AdminBanners';
import AdminPopups from './AdminPopups';
import AdminReturns from './AdminReturns';
import AdminCoupons from './AdminCoupons';
import AdminShippingTiers from './AdminShippingTiers';

const AdminLayout = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/categories', icon: Tag, label: 'Categories' },
    { path: '/admin/coupons', icon: Ticket, label: 'Coupons' },
    { path: '/admin/returns', icon: RefreshCw, label: 'Returns' },
    { path: '/admin/shipping', icon: Truck, label: 'Shipping' },
    { path: '/admin/pincode', icon: MapPin, label: 'Pincode & GST' },
    { path: '/admin/banners', icon: Image, label: 'Banners' },
    { path: '/admin/popups', icon: Bell, label: 'Popups' },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/5 min-h-screen border-r border-white/10 sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <h1 className="text-2xl font-black mb-8">
              <span className="text-[#E10600]">D</span>RIEDIT
              <span className="block text-sm text-gray-400 font-normal">Admin Panel</span>
            </h1>
            
            <nav className="space-y-1" data-testid="admin-nav">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded transition-colors ${
                      active 
                        ? 'bg-[#E10600] text-white' 
                        : 'hover:bg-white/5 text-gray-400'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
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
                data-testid="back-to-store-btn"
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-bold">Back to Store</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 min-h-screen">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/products" element={<AdminProducts />} />
            <Route path="/categories" element={<AdminCategories />} />
            <Route path="/coupons" element={<AdminCoupons />} />
            <Route path="/returns" element={<AdminReturns />} />
            <Route path="/pincode" element={<AdminPincode />} />
            <Route path="/banners" element={<AdminBanners />} />
            <Route path="/popups" element={<AdminPopups />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
