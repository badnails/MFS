import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  X,
  RotateCcw
} from 'lucide-react';
import TransactionDetails from '../common/TransactionDetails';

const AdminTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    searchTerm: '',
    startDate: '',
    endDate: ''
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Fetch transactions from admin endpoint
  const fetchTransactions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get('/admin/transactions');

      if (response.data) {
        let filteredData = response.data;

        // Apply client-side filters
        if (filters.status) {
          filteredData = filteredData.filter(t => 
            t.transactionstatus === filters.status
          );
        }

        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredData = filteredData.filter(t =>
            t.transactionid?.toLowerCase().includes(searchLower) ||
            t.source_name?.toLowerCase().includes(searchLower) ||
            t.destination_name?.toLowerCase().includes(searchLower)
          );
        }

        if (filters.startDate) {
          filteredData = filteredData.filter(t => {
            const transactionDate = new Date(t.initiationtimestamp);
            const startDate = new Date(filters.startDate);
            return transactionDate >= startDate;
          });
        }

        if (filters.endDate) {
          filteredData = filteredData.filter(t => {
            const transactionDate = new Date(t.initiationtimestamp);
            const endDate = new Date(filters.endDate);
            return transactionDate <= endDate;
          });
        }

        // Sort by date (newest first)
        filteredData.sort((a, b) => 
          new Date(b.initiationtimestamp) - new Date(a.initiationtimestamp)
        );

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        setTransactions(paginatedData);
        setTotalPages(Math.ceil(filteredData.length / pageSize));
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (err) {
      setError('Failed to fetch transaction history');
      console.error('Transaction fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters]);

  // Initial fetch and refetch when filters or page changes
  useEffect(() => {
    fetchTransactions(currentPage);
  }, [fetchTransactions, currentPage]);

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchTransactions(1);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      searchTerm: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'PENDING':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'FAILED':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'REVERTED':
        return { icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const handleTransactionClick = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowTransactionDetails(true);
  };

  const closeTransactionDetails = () => {
    setShowTransactionDetails(false);
    setSelectedTransactionId(null);
  };

  const exportTransactions = () => {
    // TODO: Implement export functionality
    console.log('Export functionality not yet implemented');
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">All Transactions</h2>
          <p className="text-sm text-gray-500">
            System-wide transaction monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportTransactions}
            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => fetchTransactions(currentPage)}
            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Transaction ID, Account..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REVERTED">Reverted</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="">
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="">
            {transactions.map((transaction) => {
              const statusDisplay = getStatusDisplay(transaction.transactionstatus);
              const StatusIcon = statusDisplay.icon;

              return (
                <div 
                  key={transaction.transactionid} 
                  className="px-6 py-4 hover:bg-blue-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-400"
                  onClick={() => handleTransactionClick(transaction.transactionid)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Transaction Icon */}
                      <div className="p-2 rounded-full bg-blue-100">
                        <ArrowUpRight className="h-5 w-5 text-blue-600" />
                      </div>

                      {/* Transaction Details */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {transaction.transactiontypename || 'Transfer'}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {transaction.transactionstatus || 'COMPLETED'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          From: {transaction.source_name || 'System'} → To: {transaction.destination_name || 'System'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(transaction.initiationtimestamp)}
                          <span className="mx-2">•</span>
                          ID: {transaction.transactionid}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(transaction.subamount || transaction.amount)}
                      </div>
                      {transaction.feesamount > 0 && (
                        <div className="text-sm text-gray-500">
                          Fee: {formatCurrency(transaction.feesamount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      <TransactionDetails
        transactionId={selectedTransactionId}
        isOpen={showTransactionDetails}
        onClose={closeTransactionDetails}
      />
    </div>
  );
};

export default AdminTransactionHistory;
