import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  CreditCard,
  RefreshCw,
  Percent,
  Package,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '../../services/api';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('gst');
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Report data
  const [gstReport, setGstReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [paymentReport, setPaymentReport] = useState(null);

  useEffect(() => {
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(formatDate(firstDay));
    setToDate(formatDate(now));
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchReports();
    }
  }, [activeTab, fromDate, toDate]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'gst') {
        const response = await axiosInstance.get(`/admin/reports/gst?from_date=${fromDate}&to_date=${toDate}`);
        setGstReport(response.data);
      } else if (activeTab === 'sales') {
        const response = await axiosInstance.get(`/admin/reports/sales?from_date=${fromDate}&to_date=${toDate}`);
        setSalesReport(response.data);
      } else if (activeTab === 'payments') {
        const response = await axiosInstance.get(`/admin/reports/payments?from_date=${fromDate}&to_date=${toDate}`);
        setPaymentReport(response.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const url = `${API_URL}/api/admin/reports/export/${type}?from_date=${fromDate}&to_date=${toDate}`;
      window.open(url, '_blank');
      toast.success(`${type.toUpperCase()} report download started`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Export failed');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const tabs = [
    { id: 'gst', label: 'GST Report', icon: Percent },
    { id: 'sales', label: 'Sales Report', icon: TrendingUp },
    { id: 'payments', label: 'Payment Report', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500">GST & Sales reports for accounting</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {activeTab === 'gst' && <GSTReport data={gstReport} onExport={() => handleExport('gst')} formatCurrency={formatCurrency} />}
              {activeTab === 'sales' && <SalesReport data={salesReport} onExport={() => handleExport('sales')} formatCurrency={formatCurrency} />}
              {activeTab === 'payments' && <PaymentReport data={paymentReport} formatCurrency={formatCurrency} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// GST Report Component
const GSTReport = ({ data, onExport, formatCurrency }) => {
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Orders"
          value={data.total_orders}
          icon={ShoppingBag}
          color="blue"
        />
        <KPICard
          title="Taxable Value"
          value={formatCurrency(data.taxable_value)}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="GST Collected"
          value={formatCurrency(data.gst_collected)}
          icon={Percent}
          color="red"
        />
        <KPICard
          title="Gross Revenue"
          value={formatCurrency(data.gross_revenue)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* GST Summary Table */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">GST Summary</h3>
        <table className="w-full">
          <tbody className="divide-y divide-gray-200">
            <TableRow label="Total Orders" value={data.total_orders} />
            <TableRow label="Subtotal (Before Discount)" value={formatCurrency(data.taxable_value + data.total_discount)} />
            <TableRow label="Total Discount Given" value={`- ${formatCurrency(data.total_discount)}`} highlight />
            <TableRow label="Taxable Value" value={formatCurrency(data.taxable_value)} />
            <TableRow label="GST Collected" value={formatCurrency(data.gst_collected)} />
            <TableRow label="Shipping Collected" value={formatCurrency(data.shipping_collected)} />
            <TableRow label="Gross Revenue" value={formatCurrency(data.gross_revenue)} bold />
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sales Report Component
const SalesReport = ({ data, onExport, formatCurrency }) => {
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Orders"
          value={data.total_orders}
          icon={ShoppingBag}
          color="blue"
        />
        <KPICard
          title="Gross Revenue"
          value={formatCurrency(data.gross_revenue)}
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title="Net Revenue"
          value={formatCurrency(data.net_revenue)}
          icon={DollarSign}
          color="purple"
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(data.aov)}
          icon={Package}
          color="orange"
        />
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <TableRow label="Gross Revenue" value={formatCurrency(data.gross_revenue)} />
              <TableRow label="Total Discounts" value={`- ${formatCurrency(data.total_discount)}`} highlight />
              <TableRow label="Total Refunds" value={`- ${formatCurrency(data.total_refunds)}`} highlight />
              <TableRow label="Refund Count" value={data.refund_count} />
              <TableRow label="Net Revenue" value={formatCurrency(data.net_revenue)} bold />
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          {data.top_products && data.top_products.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.top_products.map((product, index) => (
                  <tr key={index}>
                    <td className="py-2 text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {product.title}
                    </td>
                    <td className="py-2 text-sm text-gray-600 text-right">{product.quantity}</td>
                    <td className="py-2 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">No products data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Payment Report Component
const PaymentReport = ({ data, formatCurrency }) => {
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Total Revenue Card */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <p className="text-sm opacity-80">Total Revenue</p>
        <p className="text-3xl font-bold">{formatCurrency(data.total_revenue)}</p>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
        {data.payment_breakdown && data.payment_breakdown.length > 0 ? (
          <div className="space-y-4">
            {data.payment_breakdown.map((payment, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      payment.method === 'razorpay' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <CreditCard size={20} className={
                        payment.method === 'razorpay' ? 'text-blue-600' : 'text-green-600'
                      } />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.label}</p>
                      <p className="text-sm text-gray-500">{payment.order_count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.revenue)}</p>
                    <p className="text-sm text-gray-500">{payment.percentage}%</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      payment.method === 'razorpay' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${payment.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No payment data available</p>
        )}
      </div>
    </div>
  );
};

// Helper Components
const KPICard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
};

const TableRow = ({ label, value, bold, highlight }) => (
  <tr>
    <td className={`py-3 text-sm ${bold ? 'font-bold' : ''} text-gray-700`}>{label}</td>
    <td className={`py-3 text-sm text-right ${bold ? 'font-bold text-gray-900' : ''} ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
      {value}
    </td>
  </tr>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
    <p className="text-gray-500">Select a date range to view report</p>
  </div>
);

export default AdminReports;
