// src/components/PersonalDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Wallet, History, User, RefreshCw, Send, CreditCard, Store, Receipt } from 'lucide-react';
import SendMoney from './personal/SendMoney';
import CashOut from './personal/CashOut';
import MerchantPayment from './personal/MerchantPayment';
import BillPayment from './personal/BillPayment';
import axios from 'axios';

const PersonalDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/homepage');
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickActions = [
    {
      id: 'send-money',
      title: 'Send Money',
      description: 'Transfer money to other accounts',
      icon: Send,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'cash-out',
      title: 'Cash Out',
      description: 'Withdraw money from agents',
      icon: CreditCard,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'merchant-payment',
      title: 'Merchant Payment',
      description: 'Pay at stores and merchants',
      icon: Store,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      id: 'bill-payment',
      title: 'Bill Payment',
      description: 'Pay utility bills and services',
      icon: Receipt,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    }
  ];

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
    // Refresh dashboard data after any transaction
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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
              <Wallet className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">MFS Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.accountname}</span>
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
                onClick={fetchDashboardData}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Account Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available Balance
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.user ? formatCurrency(dashboardData.user.availablebalance) : '$0.00'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Current Balance
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.user ? formatCurrency(dashboardData.user.currentbalance) : '$0.00'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Account Status
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.user?.accountstatus || 'Active'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Recent Transactions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Transactions
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Your latest transaction history
                </p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
            <ul className="divide-y divide-gray-200">
              {dashboardData?.transactions?.length > 0 ? (
                dashboardData.transactions.map((transaction, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <History className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.transactiontypename || 'Transaction'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.initiationtimestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.totalamount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: {transaction.transactionstatus || 'Completed'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'send-money' && (
        <SendMoney onClose={closeModal} />
      )}
      {activeModal === 'cash-out' && (
        <CashOut onClose={closeModal} />
      )}
      {activeModal === 'merchant-payment' && (
        <MerchantPayment onClose={closeModal} />
      )}
      {activeModal === 'bill-payment' && (
        <BillPayment onClose={closeModal} />
      )}
    </div>
  );
};

export default PersonalDashboard;
