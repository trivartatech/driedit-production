import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Percent,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Stat Card Component
const StatCard = ({ title, value, subValue, icon: Icon, trend, trendUp }) => (
  <div className="bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        {subValue && (
          <p className="mt-1 text-sm text-gray-500">{subValue}</p>
        )}
      </div>
      <div className="p-3 bg-gray-100">
        <Icon className="w-5 h-5 text-gray-700" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`mt-3 flex items-center text-sm ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
        {trendUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        <span>{trend}%</span>
        <span className="ml-1 text-gray-500">vs last period</span>
      </div>
    )}
  </div>
);

// Section Header
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
  </div>
);

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState({ by_revenue: [], by_quantity: [] });
  const [couponStats, setCouponStats] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [chartDays, setChartDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [chartDays]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, chartRes, productsRes, couponsRes, conversionRes, customersRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getRevenueChart(chartDays),
        analyticsAPI.getTopProducts(5),
        analyticsAPI.getCouponAnalytics(),
        analyticsAPI.getConversion(),
        analyticsAPI.getCustomerMetrics()
      ]);

      setOverview(overviewRes.data);
      setChartData(chartRes.data.data);
      setTopProducts(productsRes.data);
      setCouponStats(couponsRes.data);
      setConversion(conversionRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const res = await analyticsAPI.getRevenueChart(chartDays);
      setChartData(res.data.data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Business performance overview</p>
        </div>

        {/* Revenue Overview Cards */}
        <div>
          <SectionHeader title="Revenue Overview" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Today"
              value={formatCurrency(overview?.today?.revenue || 0)}
              subValue={`${overview?.today?.orders || 0} orders`}
              icon={DollarSign}
            />
            <StatCard
              title="Last 7 Days"
              value={formatCurrency(overview?.week?.revenue || 0)}
              subValue={`${overview?.week?.orders || 0} orders`}
              icon={TrendingUp}
            />
            <StatCard
              title="Last 30 Days"
              value={formatCurrency(overview?.month?.revenue || 0)}
              subValue={`${overview?.month?.orders || 0} orders`}
              icon={TrendingUp}
            />
            <StatCard
              title="Lifetime"
              value={formatCurrency(overview?.lifetime?.revenue || 0)}
              subValue={`${overview?.lifetime?.orders || 0} total orders`}
              icon={Package}
            />
          </div>
        </div>

        {/* AOV Cards */}
        <div>
          <SectionHeader title="Average Order Value (AOV)" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Today AOV"
              value={formatCurrency(overview?.today?.aov || 0)}
              icon={ShoppingBag}
            />
            <StatCard
              title="7-Day AOV"
              value={formatCurrency(overview?.week?.aov || 0)}
              icon={ShoppingBag}
            />
            <StatCard
              title="30-Day AOV"
              value={formatCurrency(overview?.month?.aov || 0)}
              icon={ShoppingBag}
            />
            <StatCard
              title="Lifetime AOV"
              value={formatCurrency(overview?.lifetime?.aov || 0)}
              icon={ShoppingBag}
            />
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Revenue Trend" subtitle="Daily revenue over time" />
            <select
              value={chartDays}
              onChange={(e) => setChartDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#000000" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#E10600' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Revenue */}
          <div className="bg-white border border-gray-200 p-6">
            <SectionHeader title="Top Products by Revenue" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.by_revenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="product_title" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
                  />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="total_revenue" fill="#000000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Quantity */}
          <div className="bg-white border border-gray-200 p-6">
            <SectionHeader title="Top Products by Quantity" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.by_quantity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="product_title" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
                  />
                  <Tooltip formatter={(value) => [value, 'Units Sold']} />
                  <Bar dataKey="quantity_sold" fill="#E10600" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Coupon & Conversion Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coupon Performance */}
          <div className="bg-white border border-gray-200 p-6">
            <SectionHeader title="Coupon Performance" />
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Discount Given</span>
                <span className="font-bold text-red-600">{formatCurrency(couponStats?.total_discount_given || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Revenue with Coupon</span>
                <span className="font-bold">{formatCurrency(couponStats?.revenue_with_coupon || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Orders with Coupon</span>
                <span className="font-bold">{couponStats?.orders_with_coupon || 0} / {couponStats?.total_orders || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Coupon Usage Rate</span>
                <span className="font-bold text-lg">{couponStats?.coupon_usage_rate || 0}%</span>
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white border border-gray-200 p-6">
            <SectionHeader title="Conversion Funnel" />
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Active Carts</span>
                <span className="font-bold">{conversion?.active_carts || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Checkout Attempts</span>
                <span className="font-bold">{conversion?.checkout_attempts || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Completed Orders</span>
                <span className="font-bold text-green-600">{conversion?.completed_orders || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Cart → Checkout Rate</span>
                <span className="font-bold">{conversion?.cart_to_checkout_rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Checkout Success Rate</span>
                <span className="font-bold text-lg text-green-600">{conversion?.checkout_success_rate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Metrics */}
        <div>
          <SectionHeader title="Customer Metrics" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Customers"
              value={customers?.total_customers || 0}
              icon={Users}
            />
            <StatCard
              title="New This Month"
              value={customers?.new_customers_month || 0}
              subValue={`${customers?.new_customers_today || 0} today`}
              icon={Users}
            />
            <StatCard
              title="With Orders"
              value={customers?.customers_with_orders || 0}
              icon={ShoppingBag}
            />
            <StatCard
              title="Repeat Customers"
              value={customers?.repeat_customers || 0}
              subValue={`${customers?.repeat_rate || 0}% repeat rate`}
              icon={Percent}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
