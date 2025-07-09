// src/components/agent/TransactionHistory.jsx
import React, { useState, useEffect } from 'react';
import { X, History, Plus, Minus, RefreshCw, Calendar } from 'lucide-react';
import axios from 'axios';

const TransactionHistory = ({ onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, cash-in, cash-out
  const [dateRange, setDateRange] = useState('today'); // today, week, month

  useEffect(() => {
    fetchTransactions();
  }, [filter, dateRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/agent/transactions', {
        params: { filter, dateRange }
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Transactions</option>
                <option value="cash-in">Cash In Only</option>
                <option value="cash-out">Cash Out Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchTransactions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'CASH_IN' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'CASH_IN' ? (
                        <Plus className="h-5 w-5 text-green-600" />
                      ) : (
                        <Minus className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Customer: {transaction.customerName} ({transaction.customerAccount})
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'CASH_IN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'CASH_IN' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Commission: {formatCurrency(transaction.commission)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found for the selected filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
