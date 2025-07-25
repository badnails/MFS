// Example: src/components/agent/AgentDashboard.jsx (Updated)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Plus, Minus } from 'lucide-react';
import CashIn from './CashIn';
import CashOut from './CashOut';
import TransactionHistory from '../common/TransactionHistory';
import SidebarLayout from '../layouts/SidebarLayout';
import { agentSidebarConfig } from '../../config/sidebarConfigs';
import axios from 'axios';

const AgentDashboard = ({ reloadKey }) => {
  const { user } = useAuth();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [todayStats, setTodayStats] = useState({
    cashInCount: 0,
    cashOutCount: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    commission: 0
  });

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        const [agentRes, statsRes] = await Promise.all([
          axios.get('/agent/dashboard'),
          axios.get('/agent/stats/today')
        ]);
        setAgentData(agentRes.data);
        setTodayStats(statsRes.data);
        setError('');
      } catch (err) {
        setError('Failed to load agent data');
        console.error('Agent dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [reloadKey]);

  const handleSidebarItemClick = (itemId) => {
    setActiveView(itemId);
    if (['cash-in', 'cash-out'].includes(itemId)) {
      setActiveModal(itemId);
      setActiveView('dashboard'); // Keep dashboard view when opening modals
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    // Refresh data after closing modal
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return renderDashboardContent();
      case 'transaction-history':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
            </div>
            <div className="p-6">
              <TransactionHistory 
                accountId={user?.accountid} 
                isModal={false} 
              />
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600 mb-2">Today's Cash In</h3>
                  <p className="text-2xl font-bold text-blue-900">{todayStats.cashInCount}</p>
                  <p className="text-sm text-blue-600">{formatCurrency(todayStats.totalCashIn)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 mb-2">Today's Cash Out</h3>
                  <p className="text-2xl font-bold text-green-900">{todayStats.cashOutCount}</p>
                  <p className="text-sm text-green-600">{formatCurrency(todayStats.totalCashOut)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600 mb-2">Today's Commission</h3>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(todayStats.commission)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600 mb-2">Available Balance</h3>
                  <p className="text-2xl font-bold text-orange-900">{formatCurrency(agentData?.user?.availablebalance || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => window.location.reload()} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Agent Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Available Balance</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(agentData?.user?.availablebalance || 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Cash In</h3>
          <p className="text-2xl font-bold text-blue-600">{todayStats.cashInCount}</p>
          <p className="text-sm text-gray-500">{formatCurrency(todayStats.totalCashIn)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Cash Out</h3>
          <p className="text-2xl font-bold text-green-600">{todayStats.cashOutCount}</p>
          <p className="text-sm text-gray-500">{formatCurrency(todayStats.totalCashOut)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Commission Earned</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(todayStats.commission)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveModal('cash-in')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow transition-colors"
          >
            <div className="flex items-center justify-center">
              <Plus className="h-8 w-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Cash In</h3>
                <p className="text-sm opacity-90">Accept customer deposits</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setActiveModal('cash-out')}
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow transition-colors"
          >
            <div className="flex items-center justify-center">
              <Minus className="h-8 w-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Cash Out</h3>
                <p className="text-sm opacity-90">Process customer withdrawals</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <TransactionHistory 
          accountId={user?.accountid} 
          isModal={false} 
        />
      </div>
    </>
  );

  return (
    <SidebarLayout
      menuItems={agentSidebarConfig.menuItems}
      brandName={agentSidebarConfig.brandName}
      onMenuItemClick={handleSidebarItemClick}
      activeMenuItem={activeView}
    >
      {renderMainContent()}

      {/* Modals */}
      {activeModal === 'cash-in' && <CashIn onClose={closeModal} />}
      {activeModal === 'cash-out' && <CashOut onClose={closeModal} />}
    </SidebarLayout>
  );
};

export default AgentDashboard;
