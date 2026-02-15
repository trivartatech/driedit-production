import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Lock, User, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    // Focus last filled or first empty
    const lastIndex = Math.min(pastedData.length, 5);
    otpRefs.current[lastIndex]?.focus();
  };

  const handleInitiateRegistration = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.initiateRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      toast.success('Verification code sent to your email!');
      setStep(2);
      setCountdown(60); // Start countdown for resend
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyRegister({
        email: formData.email,
        otp: otpValue
      });

      setUser(response.data.user);
      setIsAuthenticated(true);
      toast.success('Email verified! Welcome to DRIEDIT 🔥');
      navigate('/');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.detail || 'Verification failed');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);

    try {
      await authAPI.resendOtp({ email: formData.email });
      toast.success('New verification code sent!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.response?.data?.detail || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleBackToForm = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        {/* Logo */}
        <Link to="/">
          <motion.img
            src="/driedit-logo.png"
            alt="DRIEDIT"
            className="h-10 mx-auto mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        </Link>
        
        <p className="text-gray-400 mb-8">Join the Culture</p>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="registration-form"
              className="bg-white/5 p-8 rounded-lg border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold mb-6">Create Account</h2>

              <form onSubmit={handleInitiateRegistration} className="space-y-4">
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      required
                      className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 focus:outline-none focus:border-[#E10600] text-white placeholder-gray-500"
                      data-testid="register-name-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      required
                      className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 focus:outline-none focus:border-[#E10600] text-white placeholder-gray-500"
                      data-testid="register-email-input"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password (min 8 characters)"
                      required
                      minLength="8"
                      className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 focus:outline-none focus:border-[#E10600] text-white placeholder-gray-500"
                      data-testid="register-password-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      required
                      minLength="8"
                      className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 focus:outline-none focus:border-[#E10600] text-white placeholder-gray-500"
                      data-testid="register-confirm-password-input"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E10600] text-white py-3 font-bold flex items-center justify-center space-x-2 hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid="register-submit-btn"
                >
                  <UserPlus size={20} />
                  <span>{loading ? 'SENDING CODE...' : 'CONTINUE'}</span>
                </motion.button>
              </form>

              <p className="text-xs text-gray-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-[#E10600] hover:underline font-bold">
                  Sign In
                </Link>
              </p>

              <p className="text-xs text-gray-500 mt-4">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp-verification"
              className="bg-white/5 p-8 rounded-lg border border-white/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button
                onClick={handleBackToForm}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                data-testid="back-to-form-btn"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
              <p className="text-gray-400 text-sm mb-6">
                We sent a 6-digit code to<br />
                <span className="text-white font-bold">{formData.email}</span>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* OTP Input */}
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/20 rounded focus:outline-none focus:border-[#E10600] text-white"
                      data-testid={`otp-input-${index}`}
                    />
                  ))}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-[#E10600] text-white py-3 font-bold flex items-center justify-center space-x-2 hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid="verify-otp-btn"
                >
                  <span>{loading ? 'VERIFYING...' : 'VERIFY & CREATE ACCOUNT'}</span>
                </motion.button>
              </form>

              {/* Resend OTP */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
                {countdown > 0 ? (
                  <p className="text-gray-400 text-sm">
                    Resend in <span className="text-[#E10600] font-bold">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="flex items-center gap-2 mx-auto text-[#E10600] hover:text-white transition-colors disabled:opacity-50"
                    data-testid="resend-otp-btn"
                  >
                    <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => navigate('/')}
          className="mt-6 text-gray-400 hover:text-white transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Continue as Guest →
        </motion.button>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
