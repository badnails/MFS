import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Plus, Minus } from 'lucide-react';
import CashIn from './CashIn';
import CashOut from './CashOut';
import TransactionHistory from '../common/TransactionHistory';
import SidebarLayout from '../layouts/SidebarLayout';
import { agentSidebarConfig } from '../../config/sidebarConfigs';
import { Wallet } from 'lucide-react';
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

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleSidebarItemClick = (itemId) => {
    setActiveView(itemId);
    if (['cash-in', 'cash-out'].includes(itemId)) {
      setActiveModal(itemId);
      setActiveView('dashboard'); // Keep dashboard view when opening modals
    }
  };

  const openModal = (modal) => setActiveModal(modal);
  const closeModal = () => {
    setActiveModal(null);
    // Refresh data after transaction
    axios.get('/agent/dashboard').then(res => setAgentData(res.data));
    axios.get('/agent/stats/today').then(res => setTodayStats(res.data));
  };

  const quickActions = [
    { id: 'cash-in', title: 'Cash In', icon: Plus, color: 'bg-green-500', hover: 'hover:bg-green-600' },
    { id: 'cash-out', title: 'Cash Out', icon: Minus, color: 'bg-red-500', hover: 'hover:bg-red-600' }
  ];

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
                <StatCard title="Today's Cash In" count={todayStats.cashInCount} amount={todayStats.totalCashIn} color="green" />
                <StatCard title="Today's Cash Out" count={todayStats.cashOutCount} amount={todayStats.totalCashOut} color="red" />
                <StatCard
                  title="Total Transactions"
                  count={todayStats.cashInCount + todayStats.cashOutCount}
                  amount={null}
                  color="blue"
                />
                <StatCard title="Commission Earned" count={null} amount={todayStats.commission} color="yellow" />
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                  <p className="text-sm text-gray-900">{user?.accountid}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <p className="text-sm text-gray-900">{user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <p className="text-sm text-gray-900">{user?.accountname}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <p className="text-sm text-gray-900 capitalize">{user?.accounttype}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Balance</label>
                  <p className="text-sm text-gray-900">{formatCurrency(agentData?.balance || 0)}</p>
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

      {/* Agent Balance */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between">
          <div>
            <h2 className="text-lg">Available Balance</h2>
            <p className="text-3xl font-bold">{formatCurrency(agentData?.balance || 0)}</p>
          </div>
        </div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Cash In Today" count={todayStats.cashInCount} amount={todayStats.totalCashIn} color="green" />
        <StatCard title="Cash Out Today" count={todayStats.cashOutCount} amount={todayStats.totalCashOut} color="red" />
        <StatCard
          title="Total Transactions"
          count={todayStats.cashInCount + todayStats.cashOutCount}
          amount={null}
          color="blue"
        />
        <StatCard title="Commission" count={null} amount={todayStats.commission} color="yellow" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map(({ id, title, icon: Icon, color, hover }) => ( // eslint-disable-line no-unused-vars
            <button
              key={id}
              onClick={() => openModal(id)}
              className={`${color} ${hover} text-white p-6 rounded-xl transition transform hover:scale-105 shadow`}
            >
              <div className="flex items-center justify-center">
                <Icon className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm opacity-90">
                    {id === 'cash-in' ? 'Accept customer deposits' : 'Process customer withdrawals'}
                  </p>
                </div>
              </div>
            </button>
          ))}
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
      brandIcon={Wallet}
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

const StatCard = ({ title, count, amount, color }) => {
  const colorClass = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600'
  }[color] || 'text-gray-600';

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {count !== null && <p className="text-2xl font-bold text-gray-900">{count}</p>}
      {amount !== null && <p className={`text-sm ${colorClass}`}>{formatCurrency(amount)}</p>}
    </div>
  );
};

export default AgentDashboard;
