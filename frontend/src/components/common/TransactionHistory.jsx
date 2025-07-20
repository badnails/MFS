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
  X
} from 'lucide-react';

const TransactionHistory = ({ accountId, onClose = null, isModal = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionTypes, setTransactionTypes] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    direction: 'all',
    startDate: '',
    endDate: ''
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transaction types on component mount
  useEffect(() => {
    const fetchTransactionTypes = async () => {
      try {
        const response = await axios.get('/transaction/types');
        if (response.data.valid) {
          setTransactionTypes(response.data.types);
        }
      } catch (err) {
        console.error('Failed to fetch transaction types:', err);
      }
    };

    fetchTransactionTypes();
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1) => {
    if (!accountId) return;

    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await axios.get(`/transaction/history/${accountId}`, { params });

      if (response.data.valid) {
        setTransactions(response.data.data.transactions);
        setCurrentPage(response.data.data.pagination.currentPage);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalRecords(response.data.data.pagination.totalRecords);
      } else {
        setError(response.data.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Failed to fetch transaction history');
      console.error('Transaction fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [accountId, pageSize, filters]);

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
      type: '',
      direction: 'all',
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
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Get direction icon and color
  const getDirectionDisplay = (direction) => {
    if (direction === 'sent') {
      return { icon: ArrowUpRight, color: 'text-red-600', label: 'Sent' };
    } else {
      return { icon: ArrowDownLeft, color: 'text-green-600', label: 'Received' };
    }
  };

  const containerClass = isModal 
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    : "";

  const contentClass = isModal 
    ? "bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
    : "bg-white rounded-lg shadow";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-500">
              {totalRecords} transaction{totalRecords !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center space-x-2">
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
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Direction Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direction
                </label>
                <select
                  value={filters.direction}
                  onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
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
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {transactionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
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
        <div className={`${isModal ? 'max-h-96 overflow-y-auto' : ''}`}>
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
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const statusDisplay = getStatusDisplay(transaction.status);
                const directionDisplay = getDirectionDisplay(transaction.direction);
                const StatusIcon = statusDisplay.icon;
                const DirectionIcon = directionDisplay.icon;

                return (
                  <div key={transaction.transactionId} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Direction Icon */}
                        <div className={`p-2 rounded-full ${transaction.direction === 'sent' ? 'bg-red-100' : 'bg-green-100'}`}>
                          <DirectionIcon className={`h-5 w-5 ${directionDisplay.color}`} />
                        </div>

                        {/* Transaction Details */}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {transaction.type}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {transaction.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.direction === 'sent' ? 'To: ' : 'From: '}
                            {transaction.direction === 'sent' 
                              ? transaction.destinationAccount.username || transaction.destinationAccountId
                              : transaction.sourceAccount.username || transaction.sourceAccountId
                            }
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(transaction.initiatedAt)}
                            {transaction.completedAt && transaction.completedAt !== transaction.initiatedAt && (
                              <span> • Completed: {formatDate(transaction.completedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${transaction.direction === 'sent' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.direction === 'sent' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </div>
                        {transaction.fees > 0 && transaction.direction === 'sent' && (
                          <div className="text-sm text-gray-500">
                            Fee: {formatCurrency(transaction.fees)}
                          </div>
                        )}
                        {transaction.reference && (
                          <div className="text-xs text-gray-400">
                            Ref: {transaction.reference}
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
      </div>
    </div>
  );
};

export default TransactionHistory;
