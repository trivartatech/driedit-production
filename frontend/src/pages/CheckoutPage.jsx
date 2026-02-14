import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, DollarSign, MapPin } from 'lucide-react';
import { getCart, clearCart, products } from '../mockData';
import { ordersAPI, publicAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';

const formatPrice = (price) => {
  return `₹${price.toLocaleString('en-IN')}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [pincode, setPincode] = useState('');
  const [pincodeData, setPincodeData] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCart();
    fetchGST();
  }, [isAuthenticated, navigate]);

  const loadCart = () => {
    const cart = getCart();
    const items = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, product };
    }).filter(item => item.product);
    
    if (items.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      navigate('/cart');
      return;
    }
    
    setCartItems(items);
  };

  const fetchGST = async () => {
    try {
      const response = await adminAPI.getGST();
      setGstPercentage(response.data.gst_percentage);
    } catch (error) {
      console.error('Error fetching GST:', error);
    }
  };

  const handlePincodeCheck = async () => {
    if (!pincode || pincode.length !== 6) {
      toast({ title: 'Please enter valid 6-digit pincode', variant: 'destructive' });
      return;
    }

    setPincodeChecking(true);
    try {
      const response = await publicAPI.checkPincode(pincode);
      setPincodeData(response.data);
      setAddress({ ...address, pincode });
      toast({ title: 'Delivery available!' });
    } catch (error) {
      setPincodeData(null);
      toast({ title: error.response?.data?.detail || 'Delivery not available', variant: 'destructive' });
    } finally {
      setPincodeChecking(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((acc, item) => 
      acc + (item.product.discounted_price * item.quantity), 0
    );
    const gstAmount = Math.round(subtotal * (gstPercentage / 100));
    const shipping = pincodeData ? (subtotal > 999 ? 0 : pincodeData.shipping_charge) : 0;
    const total = subtotal + gstAmount + shipping;

    return { subtotal, gstAmount, shipping, total };
  };

  const handlePlaceOrder = async () => {
    // Validate
    if (!pincodeData) {
      toast({ title: 'Please check delivery availability', variant: 'destructive' });
      return;
    }

    if (!address.phone || !address.addressLine1 || !address.city || !address.state) {
      toast({ title: 'Please fill all address fields', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'cod' && !pincodeData.cod_available) {
      toast({ title: 'COD not available for this pincode', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { subtotal, gstAmount, shipping, total } = calculateTotals();

      // Prepare order items
      const orderItems = cartItems.map(item => ({
        product_id: item.product.product_id,
        product_title: item.product.title,
        product_image: item.product.images[0],
        size: item.size,
        quantity: item.quantity,
        price: item.product.discounted_price,
        subtotal: item.product.discounted_price * item.quantity
      }));

      // Create order
      const orderData = {
        items: orderItems,
        payment_method: paymentMethod,
        delivery_address: address,
        pincode: pincode
      };

      if (paymentMethod === 'razorpay') {
        // Razorpay flow
        await handleRazorpayPayment(orderData, total);
      } else {
        // COD flow
        await handleCODOrder(orderData);
      }

    } catch (error) {
      console.error('Order error:', error);
      toast({ title: error.response?.data?.detail || 'Order failed', variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (orderData, amount) => {
    try {
      // Create Razorpay order
      const razorpayOrderRes = await ordersAPI.createRazorpayOrder(amount * 100); // Convert to paise
      const razorpayOrder = razorpayOrderRes.data;

      // Create order in backend
      const orderRes = await ordersAPI.create(orderData);
      const orderId = orderRes.data.order_id;

      // Open Razorpay modal
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'mock_key',
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'DRIEDIT',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // Verify payment
            await ordersAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId
            });

            clearCart();
            window.dispatchEvent(new Event('cartUpdated'));
            navigate(`/order-success/${orderId}`);
          } catch (error) {
            toast({ title: 'Payment verification failed', variant: 'destructive' });
            setLoading(false);
          }
        },
        prefill: {
          name: address.name,
          contact: address.phone
        },
        theme: {
          color: '#E10600'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      // Check if Razorpay is loaded (for production)
      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // Mock success for development
        toast({ title: 'Mock payment successful (development mode)' });
        await ordersAPI.verifyPayment({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: 'mock_payment_id',
          razorpay_signature: 'mock_signature',
          order_id: orderId
        });
        clearCart();
        window.dispatchEvent(new Event('cartUpdated'));
        navigate(`/order-success/${orderId}`);
      }

    } catch (error) {
      throw error;
    }
  };

  const handleCODOrder = async (orderData) => {
    try {
      const orderRes = await ordersAPI.create(orderData);
      clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
      toast({ title: 'Order placed successfully!' });
      navigate(`/order-success/${orderRes.data.order_id}`);
    } catch (error) {
      throw error;
    }
  };

  const { subtotal, gstAmount, shipping, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black mb-8">CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white/5 p-6 border border-white/10">
              <h2 className="text-2xl font-black mb-4 flex items-center space-x-2">
                <Truck size={24} className="text-[#E10600]" />
                <span>DELIVERY ADDRESS</span>
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={address.addressLine1}
                  onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={address.addressLine2}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                    required
                  />
                </div>

                {/* Pincode Check */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    maxLength="6"
                    className="flex-1 bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                    required
                  />
                  <button
                    onClick={handlePincodeCheck}
                    disabled={pincodeChecking}
                    className="bg-[#E10600] text-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    {pincodeChecking ? 'CHECKING...' : 'CHECK'}
                  </button>
                </div>

                {pincodeData && (
                  <div className="bg-green-900/20 border border-green-500 p-3 text-sm">
                    <p className="font-bold text-green-500">✓ Delivery Available</p>
                    <p>Shipping: {pincodeData.shipping_charge === 0 ? 'FREE' : formatPrice(pincodeData.shipping_charge)}</p>
                    <p>COD: {pincodeData.cod_available ? 'Available' : 'Not Available'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white/5 p-6 border border-white/10">
              <h2 className="text-2xl font-black mb-4 flex items-center space-x-2">
                <CreditCard size={24} className="text-[#E10600]" />
                <span>PAYMENT METHOD</span>
              </h2>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-[#E10600] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-bold">Credit/Debit Card, UPI, Net Banking (Razorpay)</span>
                </label>

                <label className={`flex items-center space-x-3 p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-[#E10600] transition-colors ${!pincodeData?.cod_available ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={!pincodeData?.cod_available}
                    className="w-4 h-4"
                  />
                  <span className="font-bold">Cash on Delivery (COD)</span>
                  {!pincodeData?.cod_available && pincodeData && (
                    <span className="text-xs text-gray-400">(Not available for this pincode)</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 p-6 border border-white/10 sticky top-20">
              <h2 className="text-2xl font-black mb-4">ORDER SUMMARY</h2>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex justify-between text-sm">
                    <span>{item.product.title} ({item.size}) x {item.quantity}</span>
                    <span>{formatPrice(item.product.discounted_price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({gstPercentage}%)</span>
                  <span className="font-bold">{formatPrice(gstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-bold">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-[#E10600]">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || !pincodeData}
                className="w-full bg-[#E10600] text-white py-4 font-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'PROCESSING...' : 'PLACE ORDER'}
              </button>

              {!pincodeData && (
                <p className="text-xs text-gray-400 mt-2 text-center">Please check pincode availability first</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
