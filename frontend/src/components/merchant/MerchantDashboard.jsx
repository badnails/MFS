import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Store, Plus, History, RefreshCw, Receipt } from 'lucide-react';
import CreateBill from './CreateBill';
import TransactionHistory from './TransactionHistory';
import PendingBills from './PendingBills';
import axios from 'axios';

const MerchantDashboard = ({ reloadKey }) => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, [reloadKey]);

  const handleLogout = () => logout();
  const openModal = (id) => setActiveModal(id);
  const closeModal = () => {
    setActiveModal(null);
    axios.get('/merchant/dashboard').then(res => setMerchantData(res.data));
    axios.get('/merchant/stats/today').then(res => setTodayStats(res.data));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const quickActions = [
    { id: 'create-bill', title: 'Create Bill', icon: Plus, color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
    { id: 'pending-bills', title: 'Pending Bills', icon: Receipt, color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
    { id: 'history', title: 'Payment History', icon: History, color: 'bg-green-500', hover: 'hover:bg-green-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Merchant Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-700">{user?.accountname}</p>
              <p className="text-xs text-gray-500">ID: {user?.accountid}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 flex items-center">
              <LogOut className="h-5 w-5 mr-1" /> Logout
            </button>
          </div>
        </div>
      </header> */}

      {/* Main */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded">
            {error} <button onClick={() => window.location.reload()} className="underline ml-2">Retry</button>
          </div>
        )}

        {/* Revenue Box */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg">Total Revenue</h2>
              <p className="text-3xl font-bold">{formatCurrency(merchantData?.totalRevenue || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">This Month</p>
              <p className="text-xl font-semibold">{formatCurrency(merchantData?.monthlyRevenue || 0)}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Bills Created" value={todayStats.totalBills} color="blue" />
          <StatCard
            title="Paid Bills"
            value={todayStats.paidBills}
            sub={formatCurrency(todayStats.totalRevenue)}
            color="green"
          />
          <StatCard title="Pending Bills" value={todayStats.pendingBills} sub="Awaiting" color="orange" />
          <StatCard
            title="Success Rate"
            value={
              todayStats.totalBills > 0
                ? `${Math.round((todayStats.paidBills / todayStats.totalBills) * 100)}%`
                : '0%'
            }
            sub="Today"
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map(({ id, title, icon: Icon, color, hover }) => (
              <button
                key={id}
                onClick={() => openModal(id)}
                className={`${color} ${hover} text-white p-6 rounded-xl transition transform hover:scale-105 shadow`}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className="h-8 w-8 mb-2" />
                  <span className="text-lg font-semibold">{title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 flex justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Recent Bills</h3>
              <p className="text-sm text-gray-500">Latest activity</p>
            </div>
            <button
              onClick={() => openModal('history')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              View All
            </button>
          </div>
          <div className="border-t">
            {merchantData?.recentBills?.length ? (
              <ul className="divide-y">
                {merchantData.recentBills.slice(0, 5).map((bill, idx) => (
                  <li key={idx} className="px-4 py-4 flex justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        bill.status === 'PAID' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        <span className={`text-xs font-bold ${
                          bill.status === 'PAID' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {bill.status === 'PAID' ? '✓' : '⏳'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Bill #{bill.transactionId}</p>
                        <p className="text-sm text-gray-500">Customer: {bill.customerAccount}</p>
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
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                No bills created yet
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'create-bill' && <CreateBill onClose={closeModal} />}
      {activeModal === 'pending-bills' && <PendingBills onClose={closeModal} />}
      {activeModal === 'history' && <TransactionHistory onClose={closeModal} />}
    </div>
  );
};

const StatCard = ({ title, value, sub, color }) => {
  const colorClass = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
  }[color] || 'text-gray-600';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className={`text-sm ${colorClass}`}>{sub}</p>}
    </div>
  );
};

export default MerchantDashboard;
