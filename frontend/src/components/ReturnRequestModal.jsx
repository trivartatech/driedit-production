import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Upload, Camera, Check, Loader2 } from 'lucide-react';
import { returnsAPI } from '../services/api';
import { toast } from 'sonner';

const RETURN_REASONS = [
  { value: 'wrong_size', label: 'Wrong Size' },
  { value: 'not_as_expected', label: 'Not as Expected' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'damaged', label: 'Damaged / Defective' },
  { value: 'wrong_item', label: 'Wrong Item Received' },
  { value: 'changed_mind', label: 'Changed My Mind' },
  { value: 'other', label: 'Other' }
];

const ReturnRequestModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reasons that recommend image upload
  const imageRecommendedReasons = ['damaged', 'quality_issue', 'wrong_item'];
  const showImageRecommendation = imageRecommendedReasons.includes(reason);

  const handleItemToggle = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.product_id === item.product_id && i.size === item.size);
      if (exists) {
        return prev.filter(i => !(i.product_id === item.product_id && i.size === item.size));
      } else {
        return [...prev, {
          product_id: item.product_id,
          product_title: item.product_title,
          product_image: item.product_image,
          size: item.size,
          quantity: item.quantity
        }];
      }
    });
  };

  const isItemSelected = (item) => {
    return selectedItems.some(i => i.product_id === item.product_id && i.size === item.size);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason for return');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        order_id: order.order_id,
        items: selectedItems,
        reason: reason,
        comments: comments || null,
        images: images
      };

      await returnsAPI.create(payload);
      toast.success('Return request submitted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Return request error:', error);
      const message = error.response?.data?.detail || 'Failed to submit return request';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setReason('');
    setComments('');
    setImages([]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-black border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
          data-testid="return-request-modal"
        >
          {/* Header */}
          <div className="sticky top-0 bg-black border-b border-white/10 p-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-black">REQUEST RETURN</h2>
              <p className="text-xs text-gray-400">Order: {order?.order_id}</p>
            </div>
            <button
              onClick={() => { resetForm(); onClose(); }}
              className="p-2 hover:bg-white/10 transition-colors"
              data-testid="close-modal-btn"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Step 1: Select Items */}
            <div>
              <h3 className="font-bold text-sm text-[#E10600] mb-3">1. SELECT ITEMS TO RETURN</h3>
              <div className="space-y-2">
                {order?.items?.map((item, idx) => (
                  <div
                    key={`${item.product_id}-${item.size}-${idx}`}
                    className={`flex items-center space-x-3 p-3 border cursor-pointer transition-all ${
                      isItemSelected(item)
                        ? 'bg-[#E10600]/20 border-[#E10600]'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                    onClick={() => handleItemToggle(item)}
                    data-testid={`return-item-${item.product_id}`}
                  >
                    <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                      isItemSelected(item) ? 'border-[#E10600] bg-[#E10600]' : 'border-white/30'
                    }`}>
                      {isItemSelected(item) && <Check size={14} className="text-white" />}
                    </div>
                    <img
                      src={item.product_image || '/placeholder.jpg'}
                      alt={item.product_title}
                      className="w-14 h-18 object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.product_title}</p>
                      <p className="text-xs text-gray-400">Size: {item.size} | Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedItems.length > 0 && (
                <p className="text-xs text-[#E10600] mt-2">{selectedItems.length} item(s) selected</p>
              )}
            </div>

            {/* Step 2: Reason */}
            <div>
              <h3 className="font-bold text-sm text-[#E10600] mb-3">2. REASON FOR RETURN</h3>
              <div className="grid grid-cols-2 gap-2">
                {RETURN_REASONS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`p-3 text-left text-sm border transition-all ${
                      reason === r.value
                        ? 'bg-[#E10600] border-[#E10600] text-white'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                    onClick={() => setReason(r.value)}
                    data-testid={`reason-${r.value}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Comments (Optional) */}
            <div>
              <h3 className="font-bold text-sm text-[#E10600] mb-3">3. ADDITIONAL COMMENTS <span className="text-gray-400 font-normal">(Optional)</span></h3>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us more about the issue..."
                className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-[#E10600] focus:outline-none resize-none"
                rows={3}
                maxLength={500}
                data-testid="return-comments"
              />
              <p className="text-xs text-gray-500 text-right">{comments.length}/500</p>
            </div>

            {/* Step 4: Images (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-[#E10600]">
                  4. UPLOAD IMAGES <span className="text-gray-400 font-normal">(Optional)</span>
                </h3>
                {showImageRecommendation && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Recommended for this reason
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {/* Uploaded Images */}
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 border border-white/10">
                    <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-[#E10600] rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                {/* Upload Button */}
                {images.length < 3 && (
                  <label className="w-20 h-20 border border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#E10600] transition-colors">
                    <Camera size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      data-testid="image-upload-input"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Max 3 images • JPG, PNG supported</p>
            </div>

            {/* Warning */}
            <div className="bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-gray-400">
                <strong className="text-white">Please Note:</strong> Return requests are processed within 24-48 hours. 
                Ensure items are unused with original tags attached. Refunds will be processed to original payment method within 5-7 business days after approval.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0 || !reason}
              className="w-full bg-[#E10600] text-white py-4 font-black text-lg hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="submit-return-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  SUBMITTING...
                </>
              ) : (
                'SUBMIT RETURN REQUEST'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReturnRequestModal;
