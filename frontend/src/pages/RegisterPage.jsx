import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      setUser(response.data.user);
      setIsAuthenticated(true);
      toast({ title: 'Registration successful! Welcome to DRIEDIT' });
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast({ 
        title: error.response?.data?.detail || 'Registration failed', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
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
        
        <p className="text-gray-400 mb-8">Join the Culture</p>

        <motion.div
          className="bg-white/5 p-8 rounded-lg border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E10600] text-white py-3 font-bold flex items-center justify-center space-x-2 hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus size={20} />
              <span>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>
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

export default RegisterPage;
