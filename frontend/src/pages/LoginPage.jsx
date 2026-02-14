import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      setUser(response.data.user);
      setIsAuthenticated(true);
      toast({ title: 'Login successful!' });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({ 
        title: error.response?.data?.detail || 'Login failed', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    window.location.href = `${backendUrl}/api/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        {/* Logo */}
        <motion.h1
          className="text-5xl font-black mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-[#E10600]">D</span>RIEDIT
        </motion.h1>
        
        <p className="text-gray-400 mb-8">Gen-Z Streetwear Fashion</p>

        <motion.div
          className="bg-white/5 p-8 rounded-lg border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  data-testid="email-input"
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 focus:outline-none focus:border-[#E10600] text-white placeholder-gray-500"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength="8"
                  data-testid="password-input"
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 focus:outline-none focus:border-[#E10600] text-white placeholder-gray-500"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              data-testid="login-btn"
              className="w-full bg-[#E10600] text-white py-3 font-bold hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </motion.button>
            
            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-[#E10600]">
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/5 text-gray-400">OR</span>
            </div>
          </div>

          {/* Google Login */}
          <motion.button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black py-3 font-bold flex items-center justify-center space-x-2 hover:bg-gray-200 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn size={20} />
            <span>CONTINUE WITH GOOGLE</span>
          </motion.button>

          <p className="text-xs text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#E10600] hover:underline font-bold">
              Register
            </Link>
          </p>
        </motion.div>

        <motion.button
          onClick={() => window.location.href = '/'}
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

export default LoginPage;