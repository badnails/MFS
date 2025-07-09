// src/components/agent/AgentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, CreditCard, User, RefreshCw, Plus, Minus, Search, History } from 'lucide-react';
import CashIn from './CashIn';
import CashOut from './CashOut';
import TransactionHistory from './TransactionHistory';
import axios from 'axios';

const AgentDashboard = () => {
  const { user, logout } = useAuth();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [todayStats, setTodayStats] = useState({
    cashInCount: 0,
    cashOutCount: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    commission: 0
  });

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const [agentResponse, statsResponse] = await Promise.all([
        axios.get('/agent/dashboard'),
        axios.get('/agent/stats/today')
      ]);
      
      setAgentData(agentResponse.data);
      setTodayStats(statsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to load agent data');
      console.error('Agent dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
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
    fetchAgentData(); // Refresh data after transaction
  };

  const quickActions = [
    {
      id: 'cash-in',
      title: 'Cash In',
      description: 'Credit money to customer account',
      icon: Plus,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'cash-out',
      title: 'Cash Out',
      description: 'Debit money from customer account',
      icon: Minus,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600'
    },
    {
      id: 'history',
      title: 'Transaction History',
      description: 'View all transactions',
      icon: History,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading agent dashboard...</p>
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
              <CreditCard className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Agent Dashboard</h1>
                <p className="text-sm text-gray-500">Mobile Financial Services Agent</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <div className="text-right">
                  <p className="text-sm text-gray-700">{user?.accountname}</p>
                  <p className="text-xs text-gray-500">Agent ID: {user?.accountid}</p>
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
                onClick={fetchAgentData}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Agent Balance */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium opacity-90">Agent Balance</h2>
                <p className="text-3xl font-bold">
                  {agentData?.balance ? formatCurrency(agentData.balance) : '$0.00'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Available Limit</p>
                <p className="text-xl font-semibold">
                  {agentData?.availableLimit ? formatCurrency(agentData.availableLimit) : '$0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cash In Today</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.cashInCount}</p>
                  <p className="text-sm text-green-600">{formatCurrency(todayStats.totalCashIn)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Minus className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cash Out Today</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.cashOutCount}</p>
                  <p className="text-sm text-red-600">{formatCurrency(todayStats.totalCashOut)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todayStats.cashInCount + todayStats.cashOutCount}
                  </p>
                  <p className="text-sm text-blue-600">Today</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-xs font-bold">$</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Commission Earned</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayStats.commission)}</p>
                  <p className="text-sm text-yellow-600">Today</p>
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

          {/* Recent Transactions Preview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Transactions
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Your latest agent transactions
                </p>
              </div>
              <button
                onClick={() => openModal('history')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="border-t border-gray-200">
              {agentData?.recentTransactions?.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {agentData.recentTransactions.slice(0, 5).map((transaction, index) => (
                    <li key={index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'CASH_IN' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'CASH_IN' ? (
                              <Plus className="h-4 w-4 text-green-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Customer: {transaction.customerAccount}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            transaction.type === 'CASH_IN' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'CASH_IN' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'cash-in' && (
        <CashIn onClose={closeModal} />
      )}
      {activeModal === 'cash-out' && (
        <CashOut onClose={closeModal} />
      )}
      {activeModal === 'history' && (
        <TransactionHistory onClose={closeModal} />
      )}
    </div>
  );
};

export default AgentDashboard;
