import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Search, Loader2, Package, 
  AlertTriangle, X, Upload, Image as ImageIcon, CheckCircle
} from 'lucide-react';
import { productsAPI, categoriesAPI, uploadsAPI } from '../../services/api';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const formatPrice = (price) => `₹${price?.toLocaleString('en-IN') || 0}`;

const INITIAL_PRODUCT = {
  title: '',
  category_id: '',
  regular_price: '',
  discounted_price: '',
  sizes: [],
  stock: '',
  images: [],
  description: ''
};

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(categoryFilter ? { category: categoryFilter } : {}),
        categoriesAPI.getAll()
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        category_id: product.category_id,
        regular_price: product.regular_price,
        discounted_price: product.discounted_price,
        sizes: product.sizes || [],
        stock: product.stock,
        images: product.images || [],
        description: product.description
      });
    } else {
      setEditingProduct(null);
      setFormData(INITIAL_PRODUCT);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(INITIAL_PRODUCT);
  };

  const handleSizeToggle = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed per product');
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const response = await uploadsAPI.uploadProductImage(file);
        if (response.data.success) {
          // Convert relative URL to full URL
          const fullUrl = `${API}${response.data.url}`;
          uploadedUrls.push(fullUrl);
          toast.success(`Uploaded: ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload: ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Add URL manually
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const addImageUrl = () => {
    if (!urlInput.trim()) return;
    if (formData.images.length >= 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, urlInput.trim()]
    }));
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category_id || !formData.regular_price || !formData.discounted_price) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.sizes.length === 0) {
      toast.error('Please select at least one size');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        regular_price: parseFloat(formData.regular_price),
        discounted_price: parseFloat(formData.discounted_price),
        stock: parseInt(formData.stock) || 0
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.product_id, payload);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(payload);
        toast.success('Product created successfully');
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productsAPI.delete(productId);
      toast.success('Product deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black">PRODUCTS</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-[#E10600] px-4 py-2 font-bold hover:bg-white hover:text-black transition-colors"
          data-testid="add-product-btn"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-yellow-500">Low Stock Alert</p>
            <p className="text-sm text-gray-400">
              {lowStockProducts.length} product(s) have stock below 10 units:
              {' '}{lowStockProducts.map(p => p.title).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 focus:outline-none focus:border-[#E10600]"
            data-testid="search-products-input"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-4 py-3 focus:outline-none focus:border-[#E10600] min-w-[180px]"
          data-testid="category-filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/5 border border-white/10">
            <Package size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <motion.div
              key={product.product_id}
              layout
              className="bg-white/5 border border-white/10 overflow-hidden"
              data-testid={`product-card-${product.product_id}`}
            >
              <div className="relative">
                <img 
                  src={product.images?.[0] || '/placeholder.jpg'} 
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-3 py-1 font-bold">OUT OF STOCK</span>
                  </div>
                )}
                {product.stock > 0 && product.stock < 10 && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 text-xs font-bold">
                    LOW STOCK: {product.stock}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate mb-1">{product.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{product.category_name}</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-[#E10600]">{formatPrice(product.discounted_price)}</span>
                    {product.regular_price !== product.discounted_price && (
                      <span className="text-sm text-gray-500 line-through ml-2">{formatPrice(product.regular_price)}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">Stock: {product.stock}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal(product)}
                    className="flex-1 bg-white/5 py-2 text-sm font-bold hover:bg-white/10 transition-colors flex items-center justify-center space-x-1"
                    data-testid={`edit-product-btn-${product.product_id}`}
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product.product_id)}
                    className="bg-red-500/20 text-red-500 px-4 py-2 text-sm font-bold hover:bg-red-500/30 transition-colors"
                    data-testid={`delete-product-btn-${product.product_id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 w-full max-w-2xl my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black">
                  {editingProduct ? 'EDIT PRODUCT' : 'ADD PRODUCT'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Product Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                    placeholder="e.g., Oversized Graphic Tee"
                    data-testid="product-title-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      data-testid="product-category-select"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="0"
                      min="0"
                      data-testid="product-stock-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Regular Price *</label>
                    <input
                      type="number"
                      value={formData.regular_price}
                      onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="1999"
                      min="0"
                      data-testid="product-regular-price-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Discounted Price *</label>
                    <input
                      type="number"
                      value={formData.discounted_price}
                      onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600]"
                      placeholder="1499"
                      min="0"
                      data-testid="product-discounted-price-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sizes *</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeToggle(size)}
                        className={`px-3 py-1 text-sm font-bold border transition-colors ${
                          formData.sizes.includes(size)
                            ? 'bg-[#E10600] border-[#E10600] text-white'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        data-testid={`size-option-${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Product Images * <span className="text-xs">({formData.images.length}/5)</span>
                  </label>
                  
                  {/* Image Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover border border-white/10"
                            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-[#E10600] text-xs text-center py-0.5">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* File Upload */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      data-testid="image-upload-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || formData.images.length >= 5}
                      className="flex items-center space-x-2 bg-[#E10600]/20 border border-[#E10600]/50 px-4 py-2 text-sm font-bold hover:bg-[#E10600]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="upload-image-btn"
                    >
                      {uploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
                    </button>

                    {/* URL Input Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      disabled={formData.images.length >= 5}
                      className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <ImageIcon size={16} />
                      <span>Add URL</span>
                    </button>
                  </div>

                  {/* URL Input Field */}
                  {showUrlInput && (
                    <div className="flex space-x-2 mt-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 p-2 text-sm focus:outline-none focus:border-[#E10600]"
                        placeholder="https://example.com/image.jpg"
                        data-testid="image-url-input"
                      />
                      <button
                        type="button"
                        onClick={addImageUrl}
                        className="bg-[#E10600] px-4 text-sm font-bold hover:bg-white hover:text-black transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Supported: JPG, PNG, WebP, GIF (max 5MB each)
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] h-24"
                    placeholder="Product description..."
                    data-testid="product-description-input"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#E10600] py-3 font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    data-testid="save-product-btn"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}
                    <span>{saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-6 w-full max-w-sm text-center"
              onClick={e => e.stopPropagation()}
            >
              <Trash2 size={48} className="mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-black mb-2">DELETE PRODUCT?</h2>
              <p className="text-gray-400 mb-6">This action cannot be undone.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-white/20 py-3 font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-500 py-3 font-bold hover:bg-red-600 transition-colors"
                  data-testid="confirm-delete-btn"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
