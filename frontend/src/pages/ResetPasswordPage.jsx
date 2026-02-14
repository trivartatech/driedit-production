import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setVerifying(false);
      return;
    }

    try {
      const response = await authAPI.verifyResetToken(token);
      setTokenValid(true);
      setEmail(response.data.email);
    } catch (error) {
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password reset successful!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  // Invalid/expired token
  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-red-500/10 border border-red-500/30 p-6 mb-6">
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-black mb-2">INVALID LINK</h1>
            <p className="text-gray-400 text-sm">
              This password reset link is invalid or has expired.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="block w-full bg-[#E10600] py-3 font-bold hover:bg-white hover:text-black transition-colors text-center"
            >
              Request New Link
            </Link>
            <Link
              to="/login"
              className="block w-full border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors text-center"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-green-500/10 border border-green-500/30 p-6 mb-6">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-black mb-2">PASSWORD RESET!</h1>
            <p className="text-gray-400 text-sm">
              Your password has been updated successfully.
            </p>
          </div>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#E10600] py-4 font-black hover:bg-white hover:text-black transition-colors"
          >
            LOGIN WITH NEW PASSWORD
          </button>
        </motion.div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="text-4xl font-black mb-2">
          RESET <span className="text-[#E10600]">PASSWORD</span>
        </h1>
        <p className="text-gray-400 mb-8">
          Enter a new password for <strong className="text-white">{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 pl-12 pr-12 py-4 focus:outline-none focus:border-[#E10600] transition-colors"
                placeholder="Enter new password"
                data-testid="new-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 focus:outline-none focus:border-[#E10600] transition-colors"
                placeholder="Confirm new password"
                data-testid="confirm-password-input"
              />
            </div>
          </div>

          {password && (
            <div className="text-xs space-y-1">
              <div className={`flex items-center space-x-2 ${password.length >= 6 ? 'text-green-500' : 'text-gray-500'}`}>
                {password.length >= 6 ? <CheckCircle size={12} /> : <span className="w-3 h-3 border border-current rounded-full" />}
                <span>At least 6 characters</span>
              </div>
              <div className={`flex items-center space-x-2 ${password === confirmPassword && confirmPassword ? 'text-green-500' : 'text-gray-500'}`}>
                {password === confirmPassword && confirmPassword ? <CheckCircle size={12} /> : <span className="w-3 h-3 border border-current rounded-full" />}
                <span>Passwords match</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirmPassword}
            className="w-full bg-[#E10600] py-4 font-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            data-testid="reset-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>RESETTING...</span>
              </>
            ) : (
              <span>RESET PASSWORD</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
