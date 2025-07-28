import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataReloadContext } from '../../hooks/useDataReload';
import { RefreshCw, DollarSign, Receipt } from 'lucide-react';
import NewTransaction from './NewTransaction';
import TransactionHistory from '../common/TransactionHistory';
import SidebarLayout from '../layouts/SidebarLayout';
import { merchantSidebarConfig } from '../../config/sidebarConfigs';
import { Wallet } from 'lucide-react';
import axios from 'axios';

const MerchantDashboardContent = ({ activeView, activeModal, setActiveModal }) => {
  const { user } = useAuth();
  const reloadKey = useDataReloadContext();
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayStats, setTodayStats] = useState({
    totalBills: 0,
    paidBills: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        setLoading(true);
        const [merchantRes, statsRes] = await Promise.all([
          axios.get('/merchant/dashboard'),
          axios.get('/merchant/stats/today')
        ]);
        setMerchantData(merchantRes.data);
        setTodayStats(statsRes.data);
        setError('');
      } catch (err) {
        setError('Failed to load merchant data');
        console.error('Merchant dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, [reloadKey]);

  const openModal = (id) => setActiveModal(id);
  const closeModal = () => {
    setActiveModal(null);
  };

  const quickActions = [
    { id: 'new-transaction', title: 'New Transaction', icon: DollarSign, color: 'bg-green-500', hover: 'hover:bg-green-600' }
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
              <TransactionHistory accountId={user?.accountid} isModal={false} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Bills" count={todayStats.totalBills} amount={null} color="blue" />
                <StatCard title="Paid Bills" count={todayStats.paidBills} amount={null} color="green" />
                <StatCard title="Total Revenue" count={null} amount={todayStats.totalRevenue} color="purple" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <p className="text-sm text-gray-900">{merchantData?.businessName || 'N/A'}</p>
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

      {/* Merchant Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Bills Today" count={todayStats.totalBills} amount={null} color="blue" />
        <StatCard title="Paid Bills" count={todayStats.paidBills} amount={null} color="green" />
        <StatCard title="Revenue Today" count={null} amount={todayStats.totalRevenue} color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4">
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
                    Create payment requests for customers
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="p-6">
            <TransactionHistory accountId={user?.accountid} isModal={false} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {renderMainContent()}

      {/* Modals */}
      {activeModal === 'new-transaction' && <NewTransaction onClose={closeModal} />}
    </>
  );
};

const MerchantDashboard = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  const handleSidebarItemClick = (itemId) => {
    setActiveView(itemId);
    if (['new-transaction'].includes(itemId)) {
      setActiveModal(itemId);
      setActiveView('dashboard'); // Keep dashboard view when opening modals
    }
  };

  return (
    <SidebarLayout
      menuItems={merchantSidebarConfig.menuItems}
      brandName={merchantSidebarConfig.brandName}
      brandIcon={Wallet}
      onMenuItemClick={handleSidebarItemClick}
      activeMenuItem={activeView}
    >
      <MerchantDashboardContent 
        activeView={activeView}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />
    </SidebarLayout>
  );
};

const StatCard = ({ title, count, amount, color }) => {
  const colorClass = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
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

export default MerchantDashboard;
