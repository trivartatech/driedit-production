import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { ordersAPI } from '../services/api';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E10600]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <button onClick={() => navigate('/')} className="bg-[#E10600] text-white px-6 py-3 font-bold">
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-8"
        >
          <CheckCircle size={80} className="mx-auto text-green-500" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-black mb-4"
        >
          ORDER PLACED!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-400 mb-8"
        >
          Thank you for shopping with DRIEDIT
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 p-8 border border-white/10 mb-8"
        >
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Order ID</p>
            <p className="text-2xl font-black text-[#E10600]">{order.order_id}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Order Status</p>
              <p className="font-bold uppercase">{order.order_status}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Payment Method</p>
              <p className="font-bold uppercase">{order.payment_method}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Total Amount</p>
              <p className="font-bold text-lg">₹{order.total.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Items</p>
              <p className="font-bold">{order.items.length} item(s)</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-[#E10600]/10 border border-[#E10600] p-4 mb-8"
        >
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Package size={20} />
            <p>Expected delivery: <span className="font-bold">5-7 business days</span></p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={() => navigate('/my-orders')}
            className="w-full bg-[#E10600] text-white py-4 font-black hover:bg-white hover:text-black transition-colors flex items-center justify-center space-x-2"
          >
            <span>VIEW MY ORDERS</span>
            <ArrowRight size={20} />
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
          >
            CONTINUE SHOPPING
          </button>
        </motion.div>

        <p className="text-xs text-gray-500 mt-8">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
