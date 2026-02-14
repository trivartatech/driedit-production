import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import { ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productsAPI, categoriesAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setUser, setIsAuthenticated, isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Handle Google OAuth success redirect
    const loginParam = searchParams.get('login');
    const errorParam = searchParams.get('error');
    
    if (loginParam === 'success') {
      // Fetch user data after OAuth redirect
      authAPI.getMe()
        .then(response => {
          setUser(response.data);
          setIsAuthenticated(true);
          toast({ title: 'Welcome to DRIEDIT!' });
        })
        .catch(err => {
          console.error('Failed to fetch user after OAuth:', err);
        });
      
      // Clean up URL
      searchParams.delete('login');
      setSearchParams(searchParams);
    }
    
    if (errorParam) {
      const errorMessages = {
        'oauth_denied': 'Google sign-in was cancelled',
        'no_code': 'Authentication failed - no code received',
        'invalid_state': 'Authentication failed - invalid state',
        'token_exchange_failed': 'Authentication failed - please try again',
        'no_access_token': 'Authentication failed - no token received',
        'userinfo_failed': 'Failed to get user information',
        'no_email': 'Email not provided by Google',
        'network_error': 'Network error - please try again',
        'server_error': 'Server error - please try again'
      };
      
      toast({ 
        title: errorMessages[errorParam] || 'Authentication failed',
        variant: 'destructive'
      });
      
      // Clean up URL
      searchParams.delete('error');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, setUser, setIsAuthenticated]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll({ limit: 6, sort: 'featured' }),
        categoriesAPI.getAll()
      ]);
      setFeaturedProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h2 
          className="text-3xl md:text-5xl font-black mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          SHOP BY <span className="text-[#E10600]">CATEGORY</span>
        </motion.h2>
        
        {loading ? (
          <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 h-14 w-full animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
            {categories.map((category, index) => (
              <motion.button
                key={category.category_id}
                onClick={() => navigate('/products')}
                className="w-full bg-transparent hover:bg-[#E10600] border-2 border-white/20 hover:border-[#E10600] py-4 px-8 transition-all duration-300 group text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg font-black tracking-wider group-hover:text-white transition-colors">
                  {category.name.toUpperCase()}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <motion.h2 
            className="text-3xl md:text-5xl font-black"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            NEW <span className="text-[#E10600]">DROPS</span>
          </motion.h2>
          <motion.button
            onClick={() => navigate('/products')}
            className="flex items-center space-x-2 text-sm font-bold hover:text-[#E10600] transition-colors"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span>VIEW ALL</span>
            <ArrowRight size={16} />
          </motion.button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-[#E10600] text-white py-20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-4xl md:text-6xl font-black mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            JOIN THE CULTURE
          </motion.h2>
          <motion.p 
            className="text-lg md:text-xl mb-8 opacity-90"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Get exclusive access to new drops and special offers
          </motion.p>
          <motion.button
            className="bg-white text-[#E10600] px-8 py-4 font-black text-sm hover:bg-black hover:text-white transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            SIGN UP NOW
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;