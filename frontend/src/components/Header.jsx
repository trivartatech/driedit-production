import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, Heart, User, Search, LogOut, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { wishlistAPI, cartAPI } from '../services/api';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    updateCounts();
    window.addEventListener('storage', updateCounts);
    window.addEventListener('cartUpdated', updateCounts);
    window.addEventListener('wishlistUpdated', updateCounts);
    
    return () => {
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('cartUpdated', updateCounts);
      window.removeEventListener('wishlistUpdated', updateCounts);
    };
  }, [isAuthenticated]);

  const updateCounts = async () => {
    if (isAuthenticated) {
      try {
        // Fetch cart count from backend
        const cartResponse = await cartAPI.getCount();
        setCartCount(cartResponse.data.count || 0);
        
        // Fetch wishlist from backend
        const wishlistResponse = await wishlistAPI.get();
        setWishlistCount(wishlistResponse.data.length || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
        setCartCount(0);
        setWishlistCount(0);
      }
    } else {
      setCartCount(0);
      setWishlistCount(0);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <motion.header 
        className="bg-black text-white sticky top-0 z-50 border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl font-black tracking-tighter">
                  <span className="text-[#E10600]">D</span>RIEDIT
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/products" className="text-sm font-semibold hover:text-[#E10600] transition-colors">
                SHOP
              </Link>
              <Link to="/products" className="text-sm font-semibold hover:text-[#E10600] transition-colors">
                NEW DROPS
              </Link>
              <Link to="/products" className="text-sm font-semibold hover:text-[#E10600] transition-colors">
                COLLECTIONS
              </Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              <button className="hidden md:block hover:text-[#E10600] transition-colors">
                <Search size={20} />
              </button>
              
              <Link to="/wishlist" className="relative hover:text-[#E10600] transition-colors">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#E10600] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              
              <Link to="/cart" className="relative hover:text-[#E10600] transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#E10600] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-3">
                  <Link to="/profile" className="hover:text-[#E10600] transition-colors" title="My Account">
                    <User size={20} />
                  </Link>
                  <Link to="/my-orders" className="hover:text-[#E10600] transition-colors" title="My Orders">
                    <Package size={20} />
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-bold hover:text-[#E10600] transition-colors">
                      ADMIN
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="hover:text-[#E10600] transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="hidden md:block hover:text-[#E10600] transition-colors">
                  <User size={20} />
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-white/10 overflow-hidden"
          >
            <nav className="px-4 py-4 space-y-4">
              <Link 
                to="/products" 
                className="block text-sm font-semibold hover:text-[#E10600] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                SHOP
              </Link>
              <Link 
                to="/products" 
                className="block text-sm font-semibold hover:text-[#E10600] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                NEW DROPS
              </Link>
              <Link 
                to="/products" 
                className="block text-sm font-semibold hover:text-[#E10600] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                COLLECTIONS
              </Link>
              <div className="border-t border-white/10 pt-4 space-y-4">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/profile"
                      className="flex items-center space-x-2 text-sm font-semibold hover:text-[#E10600] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={18} />
                      <span>MY ACCOUNT</span>
                    </Link>
                    <Link 
                      to="/my-orders"
                      className="flex items-center space-x-2 text-sm font-semibold hover:text-[#E10600] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package size={18} />
                      <span>MY ORDERS</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link 
                        to="/admin"
                        className="flex items-center space-x-2 text-sm font-semibold hover:text-[#E10600] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>ADMIN PANEL</span>
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 text-sm font-semibold hover:text-[#E10600] transition-colors"
                    >
                      <LogOut size={18} />
                      <span>LOGOUT</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login"
                    className="flex items-center space-x-2 text-sm font-semibold hover:text-[#E10600] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>LOGIN</span>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;