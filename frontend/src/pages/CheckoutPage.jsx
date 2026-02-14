import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, MapPin, Loader2, ArrowLeft, Tag, X, CheckCircle } from 'lucide-react';
import { cartAPI, ordersAPI, publicAPI, couponsAPI, shippingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const formatPrice = (price) => {
  return `₹${price?.toLocaleString('en-IN') || 0}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [pincode, setPincode] = useState('');
  const [pincodeData, setPincodeData] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.name) {
      setAddress(prev => ({ ...prev, name: user.name }));
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [cartResponse, gstResponse] = await Promise.all([
        cartAPI.get(),
        publicAPI.getGST()
      ]);
      
      const items = cartResponse.data.items || [];
      
      if (items.length === 0) {
        toast.error('Cart is empty');
        navigate('/cart');
        return;
      }
      
      setCartItems(items);
      setGstPercentage(gstResponse.data.gst_percentage || 18);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load checkout data');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeCheck = async () => {
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter valid 6-digit pincode');
      return;
    }

    setPincodeChecking(true);
    try {
      const response = await publicAPI.checkPincode(pincode);
      setPincodeData(response.data);
      setAddress(prev => ({ ...prev, pincode }));
      toast.success('Delivery available!');
    } catch (error) {
      setPincodeData(null);
      toast.error(error.response?.data?.detail || 'Delivery not available for this pincode');
    } finally {
      setPincodeChecking(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((acc, item) => 
      acc + ((item.product?.discounted_price || 0) * item.quantity), 0
    );
    const gstAmount = Math.round(subtotal * (gstPercentage / 100));
    const shipping = pincodeData ? (subtotal > 999 ? 0 : pincodeData.shipping_charge) : 0;
    const subtotalWithGst = subtotal + gstAmount + shipping;
    const discount = couponApplied ? couponApplied.discount_amount : 0;
    const total = subtotalWithGst - discount;

    return { subtotal, gstAmount, shipping, discount, total, subtotalWithGst };
  };

  // Coupon functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const { subtotalWithGst } = calculateTotals();
      const response = await couponsAPI.validate(couponCode, subtotalWithGst);
      
      setCouponApplied({
        code: response.data.coupon_code,
        discount_amount: response.data.discount_amount,
        message: response.data.message
      });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const validateForm = () => {
    if (!pincodeData) {
      toast.error('Please check delivery availability');
      return false;
    }

    if (!address.name || !address.phone || !address.addressLine1 || !address.city || !address.state) {
      toast.error('Please fill all required address fields');
      return false;
    }

    if (address.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    if (paymentMethod === 'cod' && !pincodeData.cod_available) {
      toast.error('COD not available for this pincode');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      const { total } = calculateTotals();

      // Prepare order items
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        product_title: item.product?.title || 'Product',
        product_image: item.product?.images?.[0] || '',
        size: item.size,
        quantity: item.quantity,
        price: item.product?.discounted_price || 0,
        subtotal: (item.product?.discounted_price || 0) * item.quantity
      }));

      // Create order data
      const orderData = {
        items: orderItems,
        payment_method: paymentMethod,
        delivery_address: address,
        pincode: pincode,
        coupon_code: couponApplied?.code || null,
        coupon_discount: couponApplied?.discount_amount || 0
      };

      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(orderData, total);
      } else {
        await handleCODOrder(orderData);
      }

    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async (orderData, amount) => {
    try {
      // Create Razorpay order on backend
      const razorpayOrderRes = await ordersAPI.createRazorpayOrder(amount * 100);
      const razorpayOrder = razorpayOrderRes.data;

      // Create order in backend (pending payment)
      const orderRes = await ordersAPI.create(orderData);
      const orderId = orderRes.data.order_id;

      // Get Razorpay key from environment
      const razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID;

      // Check if this is a mock payment (no real keys configured)
      if (razorpayOrder.mock || !razorpayKeyId) {
        console.log('Razorpay running in mock mode');
        toast.info('Payment simulated (test mode)');
        
        await ordersAPI.verifyPayment({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          order_id: orderId
        });
        
        await cartAPI.clear();
        window.dispatchEvent(new Event('cartUpdated'));
        navigate(`/order-success/${orderId}`);
        return;
      }

      // Check if Razorpay SDK is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'DRIEDIT',
        description: `Order #${orderId}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // Verify payment signature on backend
            const verifyRes = await ordersAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId
            });

            if (verifyRes.data.verified) {
              await cartAPI.clear();
              window.dispatchEvent(new Event('cartUpdated'));
              toast.success('Payment successful!');
              navigate(`/order-success/${orderId}`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: address.name,
          contact: address.phone,
          email: user?.email || ''
        },
        notes: {
          order_id: orderId,
          customer_name: address.name
        },
        theme: {
          color: '#E10600'
        },
        modal: {
          ondismiss: function () {
            toast.warning('Payment cancelled');
            setProcessing(false);
          },
          escape: true,
          confirm_close: true
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setProcessing(false);
      });
      
      razorpay.open();

    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
    }
  };

  const handleCODOrder = async (orderData) => {
    const orderRes = await ordersAPI.create(orderData);
    await cartAPI.clear();
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Order placed successfully!');
    navigate(`/order-success/${orderRes.data.order_id}`);
  };

  const { subtotal, gstAmount, shipping, discount, total } = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
          data-testid="back-to-cart-btn"
        >
          <ArrowLeft size={20} />
          <span>Back to Cart</span>
        </button>

        <h1 className="text-4xl font-black mb-8">CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white/5 p-6 border border-white/10" data-testid="delivery-address-section">
              <h2 className="text-2xl font-black mb-4 flex items-center space-x-2">
                <Truck size={24} className="text-[#E10600]" />
                <span>DELIVERY ADDRESS</span>
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                  data-testid="address-name-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  maxLength="10"
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                  data-testid="address-phone-input"
                />
                <input
                  type="text"
                  placeholder="Address Line 1 *"
                  value={address.addressLine1}
                  onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                  data-testid="address-line1-input"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={address.addressLine2}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                  data-testid="address-line2-input"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City *"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                    data-testid="address-city-input"
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                    data-testid="address-state-input"
                  />
                </div>

                {/* Pincode Check */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Pincode *"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    maxLength="6"
                    className="flex-1 bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] text-white"
                    data-testid="pincode-input"
                  />
                  <button
                    onClick={handlePincodeCheck}
                    disabled={pincodeChecking || pincode.length !== 6}
                    className="bg-[#E10600] text-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="check-pincode-btn"
                  >
                    {pincodeChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CHECK'}
                  </button>
                </div>

                {pincodeData && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-900/20 border border-green-500 p-3 text-sm"
                    data-testid="pincode-success"
                  >
                    <p className="font-bold text-green-500">✓ Delivery Available</p>
                    <p>Shipping: {pincodeData.shipping_charge === 0 || subtotal > 999 ? 'FREE' : formatPrice(pincodeData.shipping_charge)}</p>
                    <p>COD: {pincodeData.cod_available ? 'Available' : 'Not Available'}</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white/5 p-6 border border-white/10" data-testid="payment-method-section">
              <h2 className="text-2xl font-black mb-4 flex items-center space-x-2">
                <CreditCard size={24} className="text-[#E10600]" />
                <span>PAYMENT METHOD</span>
              </h2>

              <div className="space-y-3">
                <label 
                  className={`flex items-center space-x-3 p-4 bg-white/5 border cursor-pointer transition-colors ${
                    paymentMethod === 'razorpay' ? 'border-[#E10600]' : 'border-white/10 hover:border-white/30'
                  }`}
                  data-testid="razorpay-option"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 accent-[#E10600]"
                  />
                  <span className="font-bold">Credit/Debit Card, UPI, Net Banking (Razorpay)</span>
                </label>

                <label 
                  className={`flex items-center space-x-3 p-4 bg-white/5 border cursor-pointer transition-colors ${
                    !pincodeData?.cod_available ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    paymentMethod === 'cod' ? 'border-[#E10600]' : 'border-white/10 hover:border-white/30'
                  }`}
                  data-testid="cod-option"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={!pincodeData?.cod_available}
                    className="w-4 h-4 accent-[#E10600]"
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
            <div className="bg-white/5 p-6 border border-white/10 sticky top-20" data-testid="checkout-summary">
              <h2 className="text-2xl font-black mb-4">ORDER SUMMARY</h2>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={`${item.product_id}-${item.size}`} className="flex justify-between text-sm">
                    <span className="truncate mr-2">
                      {item.product?.title || 'Product'} ({item.size}) x {item.quantity}
                    </span>
                    <span className="flex-shrink-0">{formatPrice((item.product?.discounted_price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Input */}
              <div className="border-t border-white/10 pt-4 mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Have a coupon?</label>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={18} className="text-green-500" />
                      <span className="font-mono font-bold text-green-500">{couponApplied.code}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-gray-400 hover:text-white p-1"
                      data-testid="remove-coupon-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-white/5 border border-white/10 p-3 text-sm font-mono focus:outline-none focus:border-[#E10600]"
                      data-testid="coupon-input"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="bg-white/10 border border-white/10 px-4 font-bold text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
                      data-testid="apply-coupon-btn"
                    >
                      {couponLoading ? <Loader2 size={16} className="animate-spin" /> : 'APPLY'}
                    </button>
                  </div>
                )}
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
                {discount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span className="flex items-center space-x-1">
                      <Tag size={14} />
                      <span>Coupon Discount</span>
                    </span>
                    <span className="font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-[#E10600]">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing || !pincodeData}
                className="w-full bg-[#E10600] text-white py-4 font-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                data-testid="place-order-btn"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <span>PLACE ORDER</span>
                )}
              </button>

              {!pincodeData && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Please check pincode availability first
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
