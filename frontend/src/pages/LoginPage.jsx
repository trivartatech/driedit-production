import React from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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
          <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
          <p className="text-gray-400 mb-6">Sign in to continue shopping</p>

          <motion.button
            onClick={handleLogin}
            className="w-full bg-white text-black py-4 font-bold flex items-center justify-center space-x-2 hover:bg-[#E10600] hover:text-white transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn size={20} />
            <span>SIGN IN WITH GOOGLE</span>
          </motion.button>

          <p className="text-xs text-gray-500 mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
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