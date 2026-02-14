import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, Truck, RefreshCcw, Shield } from 'lucide-react';
import { products, reviews, calculateDiscount, formatPrice, addToWishlist, removeFromWishlist, getWishlist, addToCart } from '../mockData';
import ProductCard from '../components/ProductCard';
import { toast } from '../hooks/use-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === parseInt(id));
  
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const wishlist = getWishlist();
    setIsWishlisted(wishlist.includes(product?.id));
  }, [product?.id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <button 
            onClick={() => navigate('/products')}
            className="bg-[#E10600] text-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors"
          >
            BACK TO SHOP
          </button>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount(product.regular_price, product.discounted_price);
  const productReviews = reviews.filter(r => r.product_id === product.id);
  const averageRating = productReviews.length > 0 
    ? (productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length).toFixed(1)
    : 0;

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      setIsWishlisted(false);
      toast({ title: 'Removed from wishlist' });
    } else {
      addToWishlist(product.id);
      setIsWishlisted(true);
      toast({ title: 'Added to wishlist' });
    }
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' });
      return;
    }
    addToCart(product.id, selectedSize, quantity);
    toast({ title: 'Added to cart!' });
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-white">Home</button>
          <span className="mx-2">/</span>
          <button onClick={() => navigate('/products')} className="hover:text-white">Products</button>
          <span className="mx-2">/</span>
          <span className="text-white">{product.title}</span>
        </div>

        {/* Product Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Images */}
          <div>
            <div className="relative bg-white/5 aspect-[3/4] mb-4">
              <img 
                src={product.images[currentImageIndex]} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-[#E10600] text-white px-3 py-1 font-bold">
                  -{discount}% OFF
                </div>
              )}
              
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-[#E10600] transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 hover:bg-[#E10600] transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square bg-white/5 border-2 transition-colors ${
                      currentImageIndex === index ? 'border-[#E10600]' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-4">{product.title}</h1>
            
            {/* Rating */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < averageRating ? '#E10600' : 'none'}
                    className={i < averageRating ? 'text-[#E10600]' : 'text-gray-400'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">({productReviews.length} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl font-black">{formatPrice(product.discounted_price)}</span>
              {discount > 0 && (
                <span className="text-xl text-gray-500 line-through">{formatPrice(product.regular_price)}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-400 mb-6 leading-relaxed">{product.description}</p>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">SELECT SIZE</label>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 font-bold text-sm transition-all ${
                      selectedSize === size
                        ? 'bg-[#E10600] text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">QUANTITY</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-white/5 px-4 py-2 font-bold hover:bg-white/10 transition-colors"
                >
                  -
                </button>
                <span className="text-xl font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-white/5 px-4 py-2 font-bold hover:bg-white/10 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-8">
              <motion.button
                onClick={handleAddToCart}
                className="flex-1 bg-[#E10600] text-white py-4 font-black flex items-center justify-center space-x-2 hover:bg-white hover:text-black transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingCart size={20} />
                <span>ADD TO CART</span>
              </motion.button>
              <motion.button
                onClick={handleWishlistToggle}
                className="bg-white/5 px-6 py-4 hover:bg-[#E10600] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? '#E10600' : 'none'}
                  className={isWishlisted ? 'text-[#E10600]' : ''}
                />
              </motion.button>
            </div>

            {/* Features */}
            <div className="border-t border-white/10 pt-6 space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Truck size={20} className="text-[#E10600]" />
                <span>Free shipping on orders above ₹999</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <RefreshCcw size={20} className="text-[#E10600]" />
                <span>7-day easy returns & replacements</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield size={20} className="text-[#E10600]" />
                <span>100% authentic products</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {productReviews.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-black mb-6">CUSTOMER REVIEWS</h2>
            <div className="space-y-4">
              {productReviews.map(review => (
                <div key={review.id} className="bg-white/5 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{review.user_name}</span>
                      {review.verified && (
                        <span className="text-xs bg-[#E10600] px-2 py-1">VERIFIED</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < review.rating ? '#E10600' : 'none'}
                          className={i < review.rating ? 'text-[#E10600]' : 'text-gray-400'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{review.review_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-black mb-6">YOU MAY ALSO LIKE</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;