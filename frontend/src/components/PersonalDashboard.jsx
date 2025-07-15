// src/components/PersonalDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  History,
  RefreshCw,
  Send,
  CreditCard,
  Store,
  Receipt
} from 'lucide-react';
import SendMoney from './personal/SendMoney';
import CashOut from './personal/CashOut';
import MerchantPayment from './personal/MerchantPayment';
import BillPayment from './personal/BillPayment';
import NotificationTest from './NotificationTest';
import TransactionHistory from './common/TransactionHistory';

const PersonalDashboard = () => {
  const { user } = useAuth();
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
    // {
    //   id: 'transaction-history',
    //   title: 'Transaction History',
    //   description: 'View all your transactions',
    //   icon: History,
    //   color: 'bg-indigo-500',
    //   hoverColor: 'hover:bg-indigo-600'
    // }
  ];

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
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
    <div>
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
        {/* <OverviewCard title="Current Balance" icon={Wallet} color="blue" value={formatCurrency(dashboardData?.user?.currentbalance)} /> */}
        <OverviewCard title="Account Status" icon={Receipt} color="purple" value={dashboardData?.user?.accountstatus || 'Active'} />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      

      {/* Notification Test Component */}
      <div className="mb-8">
        <NotificationTest />
      </div>

      <div>
        <TransactionHistory 
          accountId={user?.accountid} 
          isModal={false} 
        />
      </div>

      {/* Transactions
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Your latest transaction history</p>
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
            dashboardData.transactions.map((t, idx) => (
              <li key={idx} className="px-4 py-4 sm:px-6">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <History className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.transactiontype || 'Transaction'}</p>
                      <p className="text-sm text-gray-500">{formatDate(t.initiationtimestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(t.totalamount)}</p>
                    <p className="text-sm text-gray-500">Status: {t.transactionstatus || 'Completed'}</p>
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
      </div> */}

      {/* Modals */}
      {activeModal === 'send-money' && <SendMoney onClose={closeModal} />}
      {activeModal === 'cash-out' && <CashOut onClose={closeModal} />}
      {activeModal === 'merchant-payment' && <MerchantPayment onClose={closeModal} />}
      {activeModal === 'bill-payment' && <BillPayment onClose={closeModal} />}
      {/* {activeModal === 'transaction-history' && (
        <TransactionHistory 
          accountId={user?.accountid} 
          onClose={closeModal} 
          isModal={true} 
        />
      )} */}
    </div>
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
