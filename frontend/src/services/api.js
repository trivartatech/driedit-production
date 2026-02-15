import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: `${API}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Products API
export const productsAPI = {
  getAll: (params = {}) => axiosInstance.get('/products', { params }),
  getById: (id) => axiosInstance.get(`/products/${id}`),
  getRecommendations: (id, limit = 4) => axiosInstance.get(`/products/${id}/recommendations`, { params: { limit } }),
  create: (data) => axiosInstance.post('/products', data),
  update: (id, data) => axiosInstance.put(`/products/${id}`, data),
  delete: (id) => axiosInstance.delete(`/products/${id}`)
};

// Categories API
export const categoriesAPI = {
  getAll: () => axiosInstance.get('/categories'),
  create: (data) => axiosInstance.post('/categories', data),
  update: (id, data) => axiosInstance.put(`/categories/${id}`, data),
  delete: (id) => axiosInstance.delete(`/categories/${id}`)
};

// Wishlist API
export const wishlistAPI = {
  get: () => axiosInstance.get('/wishlist'),
  getProducts: () => axiosInstance.get('/wishlist/products'),
  add: (productId) => axiosInstance.post(`/wishlist/add/${productId}`),
  remove: (productId) => axiosInstance.delete(`/wishlist/remove/${productId}`)
};

// Cart API
export const cartAPI = {
  get: () => axiosInstance.get('/cart'),
  add: (data) => axiosInstance.post('/cart/add', data),
  update: (productId, size, quantity) => axiosInstance.put(`/cart/update/${productId}/${size}`, { quantity }),
  remove: (productId, size) => axiosInstance.delete(`/cart/remove/${productId}/${size}`),
  clear: () => axiosInstance.delete('/cart/clear'),
  getCount: () => axiosInstance.get('/cart/count')
};

// Orders API
export const ordersAPI = {
  create: (data) => axiosInstance.post('/orders', data),
  getMy: () => axiosInstance.get('/orders'),
  getById: (id) => axiosInstance.get(`/orders/${id}`),
  createRazorpayOrder: (amount) => axiosInstance.post('/orders/create-razorpay-order', { amount }),
  verifyPayment: (data) => axiosInstance.post('/orders/verify-payment', data),
  // Admin
  getAll: (params) => axiosInstance.get('/orders/admin/all', { params }),
  updateStatus: (id, status) => axiosInstance.put(`/orders/admin/${id}/status`, { order_status: status }),
  updateTracking: (id, data) => axiosInstance.put(`/orders/admin/${id}/tracking`, data)
};

// Reviews API
export const reviewsAPI = {
  getByProduct: (productId) => axiosInstance.get(`/reviews/product/${productId}`),
  create: (data) => axiosInstance.post('/reviews', data),
  delete: (id) => axiosInstance.delete(`/reviews/admin/${id}`)
};

// Returns API
export const returnsAPI = {
  create: (data) => axiosInstance.post('/returns', data),
  getMy: () => axiosInstance.get('/returns/my-requests'),
  checkEligibility: (orderId) => axiosInstance.get(`/returns/check-eligibility/${orderId}`),
  // Admin
  getAll: (params) => axiosInstance.get('/returns/admin/all', { params }),
  updateStatus: (id, data) => axiosInstance.put(`/returns/admin/${id}/status`, data)
};

// Admin API
export const adminAPI = {
  // Pincodes
  getPincodes: () => axiosInstance.get('/admin/pincodes'),
  createPincode: (data) => axiosInstance.post('/admin/pincodes', data),
  updatePincode: (pincode, data) => axiosInstance.put(`/admin/pincodes/${pincode}`, data),
  deletePincode: (pincode) => axiosInstance.delete(`/admin/pincodes/${pincode}`),
  
  // GST
  getGST: () => axiosInstance.get('/admin/gst'),
  updateGST: (percentage) => axiosInstance.put('/admin/gst', null, { params: { gst_percentage: percentage } }),
  
  // Banners
  getBanners: () => axiosInstance.get('/admin/banners'),
  createBanner: (data) => axiosInstance.post('/admin/banners', data),
  updateBanner: (id, data) => axiosInstance.put(`/admin/banners/${id}`, data),
  deleteBanner: (id) => axiosInstance.delete(`/admin/banners/${id}`),
  
  // Popups
  getPopups: () => axiosInstance.get('/admin/popups'),
  createPopup: (data) => axiosInstance.post('/admin/popups', data),
  updatePopup: (id, data) => axiosInstance.put(`/admin/popups/${id}`, data),
  deletePopup: (id) => axiosInstance.delete(`/admin/popups/${id}`)
};

// Public API
export const publicAPI = {
  checkPincode: (pincode) => axiosInstance.post('/public/check-pincode', { pincode }),
  getActiveBanners: () => axiosInstance.get('/admin/public/banners'),
  getActivePopup: () => axiosInstance.get('/admin/public/popup'),
  getGST: () => axiosInstance.get('/admin/public/gst')
};

// Auth API
export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  getMe: () => axiosInstance.get('/auth/me'),
  logout: () => axiosInstance.post('/auth/logout'),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => axiosInstance.post('/auth/reset-password', { token, new_password: newPassword }),
  verifyResetToken: (token) => axiosInstance.get(`/auth/verify-reset-token/${token}`)
};

// Uploads API
export const uploadsAPI = {
  // Product images
  uploadProductImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/uploads/product-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadMultipleImages: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return axiosInstance.post('/uploads/product-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (filename) => axiosInstance.delete(`/uploads/images/${filename}`),
  getImageUrl: (filename) => `${API}/api/uploads/images/${filename}`,
  
  // Banner images
  uploadBannerImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/uploads/banner-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteBannerImage: (filename) => axiosInstance.delete(`/uploads/banner-image/${filename}`),
  getBannerImageUrl: (filename) => `${API}/api/uploads/banners/${filename}`,
  
  // Popup images
  uploadPopupImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/uploads/popup-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deletePopupImage: (filename) => axiosInstance.delete(`/uploads/popup-image/${filename}`),
  getPopupImageUrl: (filename) => `${API}/api/uploads/popups/${filename}`,
  
  // Size chart PDFs
  uploadSizeChart: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/uploads/size-chart', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteSizeChart: (filename) => axiosInstance.delete(`/uploads/size-chart/${filename}`),
  getSizeChartUrl: (filename) => `${API}/api/uploads/size-charts/${filename}`
};

// Sizes API (Admin)
export const sizesAPI = {
  getAll: (includeInactive = false) => axiosInstance.get(`/admin/sizes?include_inactive=${includeInactive}`),
  getActive: () => axiosInstance.get('/admin/sizes/active'),
  create: (data) => axiosInstance.post('/admin/sizes', data),
  update: (sizeId, data) => axiosInstance.put(`/admin/sizes/${sizeId}`, data),
  delete: (sizeId) => axiosInstance.delete(`/admin/sizes/${sizeId}`),
  toggle: (sizeId) => axiosInstance.put(`/admin/sizes/${sizeId}/toggle`),
  seed: () => axiosInstance.post('/admin/sizes/seed')
};

// Coupons API
export const couponsAPI = {
  validate: (code, orderTotal) => axiosInstance.post('/coupons/validate', { code, order_total: orderTotal }),
  getAutoCoupon: (subtotal) => axiosInstance.get(`/coupons/auto-apply?subtotal=${subtotal}`),
  // Admin
  create: (data) => axiosInstance.post('/coupons/admin/create', data),
  getAll: (includeInactive = true) => axiosInstance.get(`/coupons/admin/all?include_inactive=${includeInactive}`),
  getOne: (couponId) => axiosInstance.get(`/coupons/admin/${couponId}`),
  update: (couponId, data) => axiosInstance.put(`/coupons/admin/${couponId}`, data),
  delete: (couponId) => axiosInstance.delete(`/coupons/admin/${couponId}`),
  toggle: (couponId) => axiosInstance.put(`/coupons/admin/${couponId}/toggle`)
};

// Shipping Tiers API
export const shippingAPI = {
  calculate: (subtotal) => axiosInstance.get(`/shipping-tiers/calculate?subtotal=${subtotal}`),
  getActiveTiers: () => axiosInstance.get('/shipping-tiers/all-active'),
  // Admin
  getAll: () => axiosInstance.get('/shipping-tiers/admin/all'),
  create: (data) => axiosInstance.post('/shipping-tiers/admin/create', data),
  update: (tierId, data) => axiosInstance.put(`/shipping-tiers/admin/${tierId}`, data),
  delete: (tierId) => axiosInstance.delete(`/shipping-tiers/admin/${tierId}`),
  toggle: (tierId) => axiosInstance.put(`/shipping-tiers/admin/${tierId}/toggle`)
};

// Analytics API (Admin)
export const analyticsAPI = {
  getOverview: () => axiosInstance.get('/admin/analytics/overview'),
  getRevenueChart: (days = 30) => axiosInstance.get(`/admin/analytics/revenue-chart?days=${days}`),
  getTopProducts: (limit = 5) => axiosInstance.get(`/admin/analytics/products?limit=${limit}`),
  getCouponAnalytics: () => axiosInstance.get('/admin/analytics/coupons'),
  getConversion: () => axiosInstance.get('/admin/analytics/conversion'),
  getCustomerMetrics: () => axiosInstance.get('/admin/analytics/customers')
};

// User Profile & Addresses API
export const profileAPI = {
  // Profile
  get: () => axiosInstance.get('/user/profile'),
  update: (data) => axiosInstance.put('/user/profile', data),
  
  // Addresses
  getAddresses: () => axiosInstance.get('/user/addresses'),
  addAddress: (data) => axiosInstance.post('/user/addresses', data),
  updateAddress: (addressId, data) => axiosInstance.put(`/user/addresses/${addressId}`, data),
  deleteAddress: (addressId) => axiosInstance.delete(`/user/addresses/${addressId}`),
  setDefaultAddress: (addressId) => axiosInstance.put(`/user/addresses/${addressId}/set-default`)
};

// Customers API (Admin)
export const customersAPI = {
  getAll: (params = {}) => axiosInstance.get('/admin/customers', { params }),
  getById: (customerId) => axiosInstance.get(`/admin/customers/${customerId}`),
  updateStatus: (customerId, isActive) => axiosInstance.put(`/admin/customers/${customerId}/status`, { is_active: isActive }),
  exportCSV: (params = {}) => axiosInstance.get('/admin/customers/export/csv', { 
    params, 
    responseType: 'blob' 
  }),
  exportExcel: (params = {}) => axiosInstance.get('/admin/customers/export/excel', { 
    params, 
    responseType: 'blob' 
  })
};

export default axiosInstance;