import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Download, Filter, ChevronLeft, ChevronRight, 
  User, Mail, Phone, ShoppingBag, IndianRupee, Calendar,
  FileSpreadsheet, FileText, X
} from 'lucide-react';
import { toast } from 'sonner';
import { customersAPI } from '../../services/api';

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const perPage = 20;

  useEffect(() => {
    fetchCustomers();
  }, [page, search, filters]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
        ...(filters.status && { status: filters.status })
      };
      
      const response = await customersAPI.getAll(params);
      setCustomers(response.data.customers);
      setTotalPages(response.data.total_pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ from_date: '', to_date: '', status: '' });
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const params = {
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
        ...(filters.status && { status: filters.status })
      };
      
      const response = format === 'csv' 
        ? await customersAPI.exportCSV(params)
        : await customersAPI.exportExcel(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${total} customers to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export to ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  const hasActiveFilters = filters.from_date || filters.to_date || filters.status || search;

  return (
    <div data-testid="admin-customers-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black">CUSTOMERS</h1>
          <p className="text-gray-400 mt-1">{total} total customers</p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
            data-testid="export-csv-btn"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
            data-testid="export-excel-btn"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/5 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[#E10600]"
                data-testid="search-input"
              />
            </div>
          </form>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded transition-colors ${
              showFilters || hasActiveFilters ? 'bg-[#E10600] text-white' : 'bg-white/5 hover:bg-white/10'
            }`}
            data-testid="filter-toggle-btn"
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full"></span>}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => handleFilterChange('from_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[#E10600]"
                data-testid="from-date-filter"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => handleFilterChange('to_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[#E10600]"
                data-testid="to-date-filter"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-[#E10600]"
                data-testid="status-filter"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors"
                data-testid="clear-filters-btn"
              >
                <X size={16} />
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="customers-table">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-sm">Customer</th>
                <th className="text-left px-4 py-3 font-bold text-sm hidden md:table-cell">Contact</th>
                <th className="text-center px-4 py-3 font-bold text-sm">Orders</th>
                <th className="text-right px-4 py-3 font-bold text-sm">Total Spend</th>
                <th className="text-center px-4 py-3 font-bold text-sm hidden lg:table-cell">Last Order</th>
                <th className="text-center px-4 py-3 font-bold text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E10600] mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr 
                    key={customer.user_id} 
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/customers/${customer.user_id}`)}
                    data-testid={`customer-row-${customer.user_id}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#E10600]/20 rounded-full flex items-center justify-center">
                          <User size={18} className="text-[#E10600]" />
                        </div>
                        <div>
                          <p className="font-bold">{customer.name}</p>
                          <p className="text-sm text-gray-400 md:hidden">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone size={14} />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ShoppingBag size={16} className="text-gray-400" />
                        <span className="font-bold">{customer.total_orders}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-[#E10600]">
                        {formatCurrency(customer.total_spend)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center hidden lg:table-cell">
                      <span className="text-sm text-gray-400">
                        {formatDate(customer.last_order_date)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                        customer.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Page {page} of {totalPages} ({total} customers)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="prev-page-btn"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="next-page-btn"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
