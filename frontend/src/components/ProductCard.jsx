import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const calculateDiscount = (regular, discounted) => {
  return Math.round(((regular - discounted) / regular) * 100);
};

const formatPrice = (price) => {
  return `₹${price.toLocaleString('en-IN')}`;
};

const ProductCard = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      checkWishlistStatus();
    }
  }, [product.product_id, isAuthenticated]);

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistAPI.get();
      setIsWishlisted(response.data.includes(product.product_id));
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistAPI.remove(product.product_id);
        setIsWishlisted(false);
      } else {
        await wishlistAPI.add(product.product_id);
        setIsWishlisted(true);
      }
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const discount = calculateDiscount(product.regular_price, product.discounted_price);

  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative bg-white/5 overflow-hidden aspect-[3/4]">
        {/* Product Image */}
        <motion.img
          src={product.images[currentImage]}
          alt={product.title}
          className="w-full h-full object-cover"
          onMouseEnter={() => product.images[1] && setCurrentImage(1)}
          onMouseLeave={() => setCurrentImage(0)}
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-[#E10600] text-white px-2 py-1 text-xs font-bold">
            -{discount}%
          </div>
        )}

        {/* Wishlist Button */}
        <motion.button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 bg-white/90 p-2 hover:bg-[#E10600] hover:text-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart 
            size={18} 
            fill={isWishlisted ? '#E10600' : 'none'}
            className={isWishlisted ? 'text-[#E10600]' : ''}
          />
        </motion.button>

        {/* Quick Add to Cart - Shows on Hover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 bg-black/90 p-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button className="w-full bg-white text-black py-2 font-bold text-sm hover:bg-[#E10600] hover:text-white transition-colors flex items-center justify-center space-x-2">
            <ShoppingCart size={16} />
            <span>QUICK ADD</span>
          </button>
        </motion.div>
      </div>

      {/* Product Info */}
      <div className="mt-3 px-1">
        <h3 className="font-bold text-sm mb-1 truncate">{product.title}</h3>
        <p className="text-xs text-gray-400 mb-2">{product.category}</p>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-black text-white">
            {formatPrice(product.discounted_price)}
          </span>
          {discount > 0 && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.regular_price)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;