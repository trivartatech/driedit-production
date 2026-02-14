import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCart, removeFromCart, updateCartQuantity, products, formatPrice } from '../mockData';
import { toast } from '../hooks/use-toast';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const loadCart = () => {
    const cart = getCart();
    const items = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    }).filter(item => item.product);
    setCartItems(items);
  };

  const handleRemove = (productId, size) => {
    removeFromCart(productId, size);
    loadCart();
    window.dispatchEvent(new Event('cartUpdated'));
    toast({ title: 'Removed from cart' });
  };

  const handleQuantityChange = (productId, size, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartQuantity(productId, size, newQuantity);
    loadCart();
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cartItems.reduce((acc, item) => 
    acc + (item.product.discounted_price * item.quantity), 0
  );

  const shipping = subtotal > 999 ? 0 : 99;
  const gst = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + shipping + gst;

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
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <motion.div
                key={`${item.productId}-${item.size}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 p-4 flex space-x-4"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-24 h-32 object-cover cursor-pointer"
                  onClick={() => navigate(`/product/${item.product.id}`)}
                />
                <div className="flex-1">
                  <h3 
                    className="font-bold mb-2 cursor-pointer hover:text-[#E10600] transition-colors"
                    onClick={() => navigate(`/product/${item.product.id}`)}
                  >
                    {item.product.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">Size: {item.size}</p>
                  <p className="text-lg font-black mb-4">{formatPrice(item.product.discounted_price)}</p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-black border border-white/10">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.size, item.quantity - 1)}
                        className="px-3 py-1 hover:bg-white/10 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.size, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-white/10 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.productId, item.size)}
                      className="text-[#E10600] hover:text-white transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black">
                    {formatPrice(item.product.discounted_price * item.quantity)}
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
            <div className="bg-white/5 p-6 sticky top-20">
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
                  <span className="text-gray-400">GST (18%)</span>
                  <span className="font-bold">{formatPrice(gst)}</span>
                </div>
                {subtotal < 999 && (
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
                className="w-full bg-[#E10600] text-white py-4 font-black hover:bg-white hover:text-black transition-colors mb-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                PROCEED TO CHECKOUT
              </motion.button>

              <button
                onClick={() => navigate('/products')}
                className="w-full border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors text-sm"
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