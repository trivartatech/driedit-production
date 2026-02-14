import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (error) {
      // Still show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-green-500/10 border border-green-500/30 p-6 mb-6">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-black mb-2">CHECK YOUR EMAIL</h1>
            <p className="text-gray-400 text-sm">
              If an account exists with <strong className="text-white">{email}</strong>, 
              you will receive a password reset link shortly.
            </p>
          </div>
          
          <p className="text-gray-500 text-xs mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => { setSubmitted(false); setEmail(''); }}
              className="w-full border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
            >
              Try Another Email
            </button>
            <Link
              to="/login"
              className="block w-full bg-[#E10600] py-3 font-bold hover:bg-white hover:text-black transition-colors text-center"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link 
          to="/login" 
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        <h1 className="text-4xl font-black mb-2">
          FORGOT <span className="text-[#E10600]">PASSWORD?</span>
        </h1>
        <p className="text-gray-400 mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 focus:outline-none focus:border-[#E10600] transition-colors"
                placeholder="Enter your email"
                data-testid="forgot-email-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E10600] py-4 font-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            data-testid="forgot-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>SENDING...</span>
              </>
            ) : (
              <span>SEND RESET LINK</span>
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-[#E10600] font-bold hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
