import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, Truck, RefreshCcw, Shield, Loader2, FileText, ExternalLink, Share2, Copy, Check } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { toast } from 'sonner';
import { productsAPI, reviewsAPI, wishlistAPI, cartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatPrice = (price) => {
  return `₹${price.toLocaleString('en-IN')}`;
};

const calculateDiscount = (regular, discounted) => {
  return Math.round(((regular - discounted) / regular) * 100);
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && product) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, product]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      setProduct(response.data);
      fetchRecommendations();
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getByProduct(id);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await productsAPI.getRecommendations(id, 4);
      setRelatedProducts(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistAPI.get();
      setIsWishlisted(response.data.includes(id));
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistAPI.remove(id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Error updating wishlist');
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    
    if (product.stock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    setAddingToCart(true);
    try {
      await cartAPI.add({
        product_id: product.product_id,
        size: selectedSize,
        quantity: quantity
      });
      toast.success('Added to cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        product_id: id,
        rating,
        review_text: reviewText
      });
      toast.success('Review submitted!');
      setReviewText('');
      setRating(5);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.detail || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E10600] mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const discount = calculateDiscount(product.regular_price, product.discounted_price);
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

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
              <span className="text-sm text-gray-400">({reviews.length} reviews)</span>
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

            {/* Stock Warning */}
            {product.stock < 10 && product.stock > 0 && (
              <div className="bg-[#E10600]/10 border border-[#E10600] px-4 py-2 mb-6">
                <p className="text-sm font-bold text-[#E10600]">Only {product.stock} left in stock!</p>
              </div>
            )}

            {product.stock === 0 && (
              <div className="bg-white/5 border border-white/20 px-4 py-2 mb-6">
                <p className="text-sm font-bold text-gray-400">Out of Stock</p>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold">SELECT SIZE</label>
                {product.size_chart_pdf && (
                  <a
                    href={product.size_chart_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-sm text-[#E10600] hover:underline"
                    data-testid="view-size-chart-btn"
                  >
                    <FileText size={14} />
                    <span>View Size Chart</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
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
                disabled={addingToCart || product.stock === 0}
                className="flex-1 bg-[#E10600] text-white py-4 font-black flex items-center justify-center space-x-2 hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: addingToCart ? 1 : 1.02 }}
                whileTap={{ scale: addingToCart ? 1 : 0.98 }}
                data-testid="add-to-cart-btn"
              >
                {addingToCart ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <ShoppingCart size={20} />
                )}
                <span>{addingToCart ? 'ADDING...' : 'ADD TO CART'}</span>
              </motion.button>
              <motion.button
                onClick={handleWishlistToggle}
                className="bg-white/5 px-6 py-4 hover:bg-[#E10600] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="wishlist-btn"
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
        <div className="mb-16">
          <h2 className="text-2xl font-black mb-6">CUSTOMER REVIEWS</h2>
          
          {/* Submit Review */}
          {isAuthenticated && (
            <div className="bg-white/5 p-6 mb-6">
              <h3 className="font-bold mb-4">Write a Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        size={24}
                        fill={star <= rating ? '#E10600' : 'none'}
                        className={star <= rating ? 'text-[#E10600]' : 'text-gray-400'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                className="w-full bg-white/5 border border-white/10 p-3 mb-4 focus:outline-none focus:border-[#E10600] text-white"
                rows="4"
              />
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="bg-[#E10600] text-white px-6 py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'SUBMIT REVIEW'}
              </button>
            </div>
          )}
          
          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.review_id} className="bg-white/5 p-6">
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
                  <p className="text-xs text-gray-500 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No reviews yet. Be the first to review!</p>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div data-testid="recommendations-section">
            <h2 className="text-2xl font-black mb-6">YOU MAY ALSO LIKE</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;