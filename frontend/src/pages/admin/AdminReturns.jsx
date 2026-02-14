import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Eye, CheckCircle, XCircle, Clock, 
  Loader2, Package, MessageSquare, ChevronDown
} from 'lucide-react';
import { returnsAPI } from '../../services/api';
import { toast } from 'sonner';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
});

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Requested', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500/20 text-green-500 border-green-500/50' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-500 border-red-500/50' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-500/20 text-blue-500 border-blue-500/50' },
];

const getStatusColor = (status) => {
  const found = STATUS_OPTIONS.find(s => s.value === status);
  return found?.color || 'bg-gray-500/20 text-gray-500 border-gray-500/50';
};

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await returnsAPI.getAll(params);
      setReturns(response.data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    setUpdatingStatus(requestId);
    try {
      await returnsAPI.updateStatus(requestId, { 
        status: newStatus,
        admin_notes: adminNotes || undefined
      });
      toast.success(`Return request ${newStatus}`);
      setAdminNotes('');
      fetchReturns();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const stats = {
    total: returns.length,
    requested: returns.filter(r => r.status === 'requested').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
  };

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
        <h1 className="text-4xl font-black">RETURNS</h1>
        <button 
          onClick={fetchReturns}
          className="flex items-center space-x-2 bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors"
          data-testid="refresh-returns-btn"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 p-4 border border-white/10">
          <p className="text-gray-400 text-sm">Total Requests</p>
          <p className="text-3xl font-black">{stats.total}</p>
        </div>
        <div className="bg-yellow-500/10 p-4 border border-yellow-500/30">
          <p className="text-yellow-500 text-sm">Pending</p>
          <p className="text-3xl font-black text-yellow-500">{stats.requested}</p>
        </div>
        <div className="bg-green-500/10 p-4 border border-green-500/30">
          <p className="text-green-500 text-sm">Approved</p>
          <p className="text-3xl font-black text-green-500">{stats.approved}</p>
        </div>
        <div className="bg-red-500/10 p-4 border border-red-500/30">
          <p className="text-red-500 text-sm">Rejected</p>
          <p className="text-3xl font-black text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 px-4 py-3 focus:outline-none focus:border-[#E10600] min-w-[180px]"
          data-testid="status-filter-select"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Returns List */}
      <div className="space-y-4" data-testid="returns-list">
        {returns.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10">
            <RefreshCw size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No return requests found</p>
          </div>
        ) : (
          returns.map((returnReq) => (
            <motion.div
              key={returnReq.request_id}
              layout
              className="bg-white/5 border border-white/10 overflow-hidden"
              data-testid={`return-row-${returnReq.request_id}`}
            >
              {/* Header */}
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setSelectedReturn(selectedReturn === returnReq.request_id ? null : returnReq.request_id)}
              >
                <div className="flex items-center space-x-4 mb-2 md:mb-0">
                  <div>
                    <p className="font-bold text-sm">Request: {returnReq.request_id}</p>
                    <p className="text-xs text-gray-400">Order: {returnReq.order_id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-2 py-1 border uppercase font-bold ${getStatusColor(returnReq.status)}`}>
                    {returnReq.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(returnReq.created_at)}</span>
                  <ChevronDown 
                    size={18} 
                    className={`transition-transform ${selectedReturn === returnReq.request_id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {selectedReturn === returnReq.request_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {/* Reason */}
                      <div className="bg-white/5 p-4">
                        <h3 className="font-bold text-sm text-gray-400 mb-2 flex items-center space-x-2">
                          <MessageSquare size={16} />
                          <span>REASON FOR RETURN</span>
                        </h3>
                        <p className="text-sm">{returnReq.reason}</p>
                      </div>

                      {/* Image if provided */}
                      {returnReq.image && (
                        <div>
                          <h3 className="font-bold text-sm text-gray-400 mb-2">ATTACHED IMAGE</h3>
                          <img 
                            src={returnReq.image} 
                            alt="Return request" 
                            className="max-w-xs h-32 object-cover border border-white/10"
                          />
                        </div>
                      )}

                      {/* Admin Notes */}
                      {returnReq.admin_notes && (
                        <div className="bg-blue-500/10 border border-blue-500/30 p-3">
                          <h3 className="font-bold text-sm text-blue-500 mb-1">ADMIN NOTES</h3>
                          <p className="text-sm">{returnReq.admin_notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {returnReq.status === 'requested' && (
                        <div className="space-y-3 pt-2 border-t border-white/10">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Admin Notes (optional)</label>
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 p-3 focus:outline-none focus:border-[#E10600] h-20"
                              placeholder="Add notes about this return..."
                              data-testid="admin-notes-input"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleStatusUpdate(returnReq.request_id, 'approved')}
                              disabled={updatingStatus === returnReq.request_id}
                              className="flex-1 bg-green-500 py-3 font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                              data-testid={`approve-btn-${returnReq.request_id}`}
                            >
                              {updatingStatus === returnReq.request_id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <CheckCircle size={18} />
                              )}
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(returnReq.request_id, 'rejected')}
                              disabled={updatingStatus === returnReq.request_id}
                              className="flex-1 bg-red-500 py-3 font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                              data-testid={`reject-btn-${returnReq.request_id}`}
                            >
                              {updatingStatus === returnReq.request_id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <XCircle size={18} />
                              )}
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {returnReq.status === 'approved' && (
                        <div className="pt-2 border-t border-white/10">
                          <button
                            onClick={() => handleStatusUpdate(returnReq.request_id, 'completed')}
                            disabled={updatingStatus === returnReq.request_id}
                            className="bg-blue-500 px-6 py-2 font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                            data-testid={`complete-btn-${returnReq.request_id}`}
                          >
                            {updatingStatus === returnReq.request_id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <CheckCircle size={18} />
                            )}
                            <span>Mark as Completed</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReturns;
