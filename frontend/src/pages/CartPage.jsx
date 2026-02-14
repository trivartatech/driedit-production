import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, publicAPI } from '../services/api';
import { toast } from 'sonner';

const formatPrice = (price) => {
  return `₹${price?.toLocaleString('en-IN') || 0}`;
};

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [gstPercentage, setGstPercentage] = useState(18);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    fetchGST();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const loadCart = async () => {
    try {
      const response = await cartAPI.get();
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchGST = async () => {
    try {
      const response = await publicAPI.getGST();
      setGstPercentage(response.data.gst_percentage);
    } catch (error) {
      console.error('Error fetching GST:', error);
    }
  };

  const handleRemove = async (productId, size) => {
    setUpdating(`${productId}-${size}`);
    try {
      await cartAPI.remove(productId, size);
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Removed from cart');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const handleQuantityChange = async (productId, size, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(`${productId}-${size}`);
    try {
      await cartAPI.update(productId, size, newQuantity);
      await loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => 
    acc + ((item.product?.discounted_price || 0) * item.quantity), 0
  );

  const shipping = subtotal > 999 ? 0 : 99;
  const gst = Math.round(subtotal * (gstPercentage / 100));
  const total = subtotal + shipping + gst;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={80} className="mx-auto mb-6 text-gray-600" />
          <h2 className="text-3xl font-black mb-4">YOUR CART IS EMPTY</h2>
          <p className="text-gray-400 mb-8">Add some products to get started</p>
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.h1 
          className="text-4xl md:text-6xl font-black mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          YOUR <span className="text-[#E10600]">CART</span>
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
            {cartItems.map((item, index) => (
              <motion.div
                key={`${item.product_id}-${item.size}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 p-4 flex space-x-4"
                data-testid={`cart-item-${item.product_id}`}
              >
                <img
                  src={item.product?.images?.[0] || '/placeholder.jpg'}
                  alt={item.product?.title || 'Product'}
                  className="w-24 h-32 object-cover cursor-pointer"
                  onClick={() => navigate(`/product/${item.product_id}`)}
                />
                <div className="flex-1">
                  <h3 
                    className="font-bold mb-2 cursor-pointer hover:text-[#E10600] transition-colors"
                    onClick={() => navigate(`/product/${item.product_id}`)}
                  >
                    {item.product?.title || 'Product'}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">Size: {item.size}</p>
                  <p className="text-lg font-black mb-4">
                    {formatPrice(item.product?.discounted_price)}
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-black border border-white/10">
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.size, item.quantity - 1)}
                        disabled={updating === `${item.product_id}-${item.size}` || item.quantity <= 1}
                        className="px-3 py-1 hover:bg-white/10 transition-colors disabled:opacity-50"
                        data-testid={`decrease-qty-${item.product_id}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.size, item.quantity + 1)}
                        disabled={updating === `${item.product_id}-${item.size}`}
                        className="px-3 py-1 hover:bg-white/10 transition-colors disabled:opacity-50"
                        data-testid={`increase-qty-${item.product_id}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.product_id, item.size)}
                      disabled={updating === `${item.product_id}-${item.size}`}
                      className="text-[#E10600] hover:text-white transition-colors disabled:opacity-50"
                      data-testid={`remove-item-${item.product_id}`}
                    >
                      {updating === `${item.product_id}-${item.size}` ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black">
                    {formatPrice((item.product?.discounted_price || 0) * item.quantity)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/5 p-6 sticky top-20" data-testid="order-summary">
              <h2 className="text-2xl font-black mb-6">ORDER SUMMARY</h2>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-bold">
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GST ({gstPercentage}%)</span>
                  <span className="font-bold">{formatPrice(gst)}</span>
                </div>
                {subtotal < 999 && subtotal > 0 && (
                  <p className="text-xs text-gray-400 bg-white/5 p-2">
                    Add {formatPrice(999 - subtotal)} more for FREE shipping
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-[#E10600]">{formatPrice(total)}</span>
                </div>
              </div>

              <motion.button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#E10600] text-white py-4 font-black hover:bg-white hover:text-black transition-colors mb-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="checkout-btn"
              >
                PROCEED TO CHECKOUT
              </motion.button>

              <button
                onClick={() => navigate('/products')}
                className="w-full border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors text-sm"
                data-testid="continue-shopping-btn"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
