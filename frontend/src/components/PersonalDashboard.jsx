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
import TransactionHistory from './common/TransactionHistory';

const PersonalDashboard = ({ reloadKey }) => {
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
  }, [reloadKey]);

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
