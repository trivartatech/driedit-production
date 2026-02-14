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
  getActivePopup: () => axiosInstance.get('/admin/public/popup')
};

// Auth API
export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  getMe: () => axiosInstance.get('/auth/me'),
  logout: () => axiosInstance.post('/auth/logout')
};

export default axiosInstance;