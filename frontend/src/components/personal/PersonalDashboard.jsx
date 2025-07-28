// src/components/PersonalDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useDataReloadContext } from '../../hooks/useDataReload';
import {
  Wallet,
  RefreshCw,
  Send,
  CreditCard,
  Store,
  Receipt
} from 'lucide-react';
import SendMoney from './SendMoney';
import CashOut from './CashOut';
import MerchantPayment from './MerchantPayment';
import BillPayment from './BillPayment';
import TransactionHistory from '../common/TransactionHistory';
import SidebarLayout from '../layouts/SidebarLayout';
import { personalSidebarConfig } from '../../config/sidebarConfigs';
import GeneralPopup from '../common/GeneralPopup';

const PersonalDashboardContent = ({ activeView, activeModal, setActiveModal }) => {
  const { user, logout } = useAuth();
  const reloadKey = useDataReloadContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBlockedPopup, setShowBlockedPopup] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/homepage');
      setDashboardData(response.data);
      setError('');
      
      // Check if account is blocked
      if (response.data?.user?.accountstatus === 'BLOCKED') {
        setShowBlockedPopup(true);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [reloadKey]);

  // Handle blocked account countdown and automatic logout
  useEffect(() => {
    if (!showBlockedPopup) return;

    setCountdown(5);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowBlockedPopup(false);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showBlockedPopup, logout]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
  };

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900">{user?.phonenumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                  <p className="text-sm text-gray-900">{dashboardData?.user?.accountstatus || 'Active'}</p>
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
        <OverviewCard title="Available Balance" icon={Wallet} color="green" value={formatCurrency(dashboardData?.user?.availablebalance)} />
        <OverviewCard title="Account Status" icon={Receipt} color="purple" value={dashboardData?.user?.accountstatus || 'Active'} />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ id, title, description, icon: Icon, color, hoverColor }) => ( // eslint-disable-line no-unused-vars
            <button
              key={id}
              onClick={() => openModal(id)}
              className={`${color} ${hoverColor} text-white p-6 rounded-xl shadow-sm transition-transform duration-200 hover:scale-105`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className="h-8 w-8 mb-3" />
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm opacity-90">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <TransactionHistory 
          accountId={user?.accountid} 
          isModal={false} 
        />
      </div>
    </>
  );

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
    <>
      {renderMainContent()}

      {/* Modals */}
      {activeModal === 'send-money' && <SendMoney onClose={closeModal} />}
      {activeModal === 'cash-out' && <CashOut onClose={closeModal} />}
      {activeModal === 'merchant-payment' && <MerchantPayment onClose={closeModal} />}
      {activeModal === 'bill-payment' && <BillPayment onClose={closeModal} />}

      {/* Blocked Account Popup */}
      <GeneralPopup
        isVisible={showBlockedPopup}
        mode="failure"
        title="Account Blocked"
        subtitle="Access Restricted"
        message={`Your account has been blocked. You will be logged out automatically in ${countdown} second${countdown !== 1 ? 's' : ''}.`}
        countdownSeconds={countdown}
        autoRedirect={false}
        primaryButtonText="Logout Now"
        onPrimaryAction={() => {
          setShowBlockedPopup(false);
          logout();
        }}
        onClose={() => {
          setShowBlockedPopup(false);
          logout();
        }}
      />
    </>
  );
};

const PersonalDashboard = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  const handleSidebarItemClick = (itemId) => {
    setActiveView(itemId);
    if (['send-money', 'cash-out', 'merchant-payment', 'bill-payment'].includes(itemId)) {
      setActiveModal(itemId);
      setActiveView('dashboard'); // Keep dashboard view when opening modals
    }
  };

  return (
    <SidebarLayout
      menuItems={personalSidebarConfig.menuItems}
      brandName={personalSidebarConfig.brandName}
      brandIcon={personalSidebarConfig.brandIcon}
      onMenuItemClick={handleSidebarItemClick}
      activeMenuItem={activeView}
    >
      <PersonalDashboardContent 
        activeView={activeView}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />
    </SidebarLayout>
  );
};

// Optional: Extract this to its own file if reused
const OverviewCard = ({ title, icon: Icon, color, value }) => ( // eslint-disable-line no-unused-vars
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5 flex items-center">
      <Icon className={`h-6 w-6 text-${color}-600`} />
      <div className="ml-5">
        <dt className="text-sm text-gray-500">{title}</dt>
        <dd className="text-lg font-medium text-gray-900">{value}</dd>
      </div>
    </div>
  </div>
);

export default PersonalDashboard;
