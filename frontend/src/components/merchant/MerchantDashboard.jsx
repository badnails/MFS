// src/components/merchant/MerchantDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Store, Plus, History, RefreshCw, QrCode, Receipt } from 'lucide-react';
import CreateBill from './CreateBill';
import TransactionHistory from './TransactionHistory';
import PendingBills from './PendingBills';
import axios from 'axios';

const MerchantDashboard = () => {
  const { user, logout } = useAuth();
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [todayStats, setTodayStats] = useState({
    totalBills: 0,
    paidBills: 0,
    pendingBills: 0,
    totalRevenue: 0
  });

  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const [merchantResponse, statsResponse] = await Promise.all([
        axios.get('/merchant/dashboard'),
        axios.get('/merchant/stats/today')
      ]);
      
      setMerchantData(merchantResponse.data);
      setTodayStats(statsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to load merchant data');
      console.error('Merchant dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
    fetchMerchantData(); // Refresh data after any action
  };

  const quickActions = [
    {
      id: 'create-bill',
      title: 'Create Bill',
      description: 'Generate a new payment bill for customers',
      icon: Plus,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'pending-bills',
      title: 'Pending Bills',
      description: 'View and manage pending payment bills',
      icon: Receipt,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      id: 'history',
      title: 'Payment History',
      description: 'View all completed transactions',
      icon: History,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading merchant dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Merchant Dashboard</h1>
                <p className="text-sm text-gray-500">Payment Collection Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5 text-gray-400" />
                <div className="text-right">
                  <p className="text-sm text-gray-700">{user?.accountname}</p>
                  <p className="text-xs text-gray-500">Merchant ID: {user?.accountid}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
              <button
                onClick={fetchMerchantData}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Merchant Balance */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium opacity-90">Total Revenue</h2>
                <p className="text-3xl font-bold">
                  {merchantData?.totalRevenue ? formatCurrency(merchantData.totalRevenue) : '$0.00'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">This Month</p>
                <p className="text-xl font-semibold">
                  {merchantData?.monthlyRevenue ? formatCurrency(merchantData.monthlyRevenue) : '$0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Bills Created</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.totalBills}</p>
                  <p className="text-sm text-blue-600">Today</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Paid Bills</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.paidBills}</p>
                  <p className="text-sm text-green-600">{formatCurrency(todayStats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-xs font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Bills</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.pendingBills}</p>
                  <p className="text-sm text-orange-600">Awaiting Payment</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-xs font-bold">%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todayStats.totalBills > 0 ? Math.round((todayStats.paidBills / todayStats.totalBills) * 100) : 0}%
                  </p>
                  <p className="text-sm text-purple-600">Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => openModal(action.id)}
                    className={`${action.color} ${action.hoverColor} text-white p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Icon className="h-8 w-8 mb-3" />
                      <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Bills Preview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Bills
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Your latest payment bills
                </p>
              </div>
              <button
                onClick={() => openModal('history')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="border-t border-gray-200">
              {merchantData?.recentBills?.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {merchantData.recentBills.slice(0, 5).map((bill, index) => (
                    <li key={index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            bill.status === 'PAID' ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            {bill.status === 'PAID' ? (
                              <span className="text-green-600 text-xs font-bold">✓</span>
                            ) : (
                              <span className="text-orange-600 text-xs font-bold">⏳</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              Bill #{bill.transactionId}
                            </p>
                            <p className="text-sm text-gray-500">
                              Customer: {bill.customerAccount}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            bill.status === 'PAID' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {formatCurrency(bill.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(bill.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bills created yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'create-bill' && (
        <CreateBill onClose={closeModal} />
      )}
      {activeModal === 'pending-bills' && (
        <PendingBills onClose={closeModal} />
      )}
      {activeModal === 'history' && (
        <TransactionHistory onClose={closeModal} />
      )}
    </div>
  );
};

export default MerchantDashboard;
