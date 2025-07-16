import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, CreditCard, User, RefreshCw, Plus, Minus, History } from 'lucide-react';
import CashIn from './CashIn';
import CashOut from './CashOut';
import TransactionHistory from '../common/TransactionHistory';
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
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleLogout = () => logout();
  const openModal = (modal) => setActiveModal(modal);
  const closeModal = () => {
    setActiveModal(null);
    // Refresh data after transaction
    axios.get('/agent/dashboard').then(res => setAgentData(res.data));
    axios.get('/agent/stats/today').then(res => setTodayStats(res.data));
  };

  const quickActions = [
    { id: 'cash-in', title: 'Cash In', icon: Plus, color: 'bg-green-500', hover: 'hover:bg-green-600' },
    { id: 'cash-out', title: 'Cash Out', icon: Minus, color: 'bg-red-500', hover: 'hover:bg-red-600' },
    { id: 'history', title: 'History', icon: History, color: 'bg-blue-500', hover: 'hover:bg-blue-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Agent Dashboard</h1>
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

        {/* Agent Balance */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg">Balance</h2>
              <p className="text-3xl font-bold">{formatCurrency(agentData?.balance || 0)}</p>
            </div>
            {/* <div className="text-right">
              <p className="text-sm">Limit</p>
              <p className="text-xl font-semibold">{formatCurrency(agentData?.availableLimit || 0)}</p>
            </div> */}
          </div>
        </div>

        {/* Today Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Cash In" count={todayStats.cashInCount} amount={todayStats.totalCashIn} color="green" />
          <StatCard title="Cash Out" count={todayStats.cashOutCount} amount={todayStats.totalCashOut} color="red" />
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
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map(({ id, title, icon: Icon, color, hover }) => (
              <button
                key={id}
                onClick={() => openModal(id)}
                className={`${color} ${hover} text-white p-6 rounded-xl transition transform hover:scale-105 shadow`}
              >
                <div className="flex flex-col items-center">
                  <Icon className="h-8 w-8 mb-2" />
                  <span className="text-lg font-semibold">{title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions Preview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 flex justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500">Latest activity</p>
            </div>
            <button
              onClick={() => openModal('history')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View All
            </button>
          </div>
          <div className="border-t">
            {/* {agentData?.recentTransactions?.length ? (
              <ul className="divide-y">
                {agentData.recentTransactions.slice(0, 5).map((tx, idx) => (
                  <li key={idx} className="px-4 py-4 flex justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        tx.type === 'CASH_IN' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'CASH_IN' ? (
                          <Plus className="h-4 w-4 text-green-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">{tx.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}</p>
                        <p className="text-sm text-gray-500">Customer: {tx.customerAccount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        tx.type === 'CASH_IN' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'CASH_IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">No transactions yet today</div>
            )} */}
            <TransactionHistory
              accountId={user?.accountid}
              isModal={false}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'cash-in' && <CashIn onClose={closeModal} />}
      {activeModal === 'cash-out' && <CashOut onClose={closeModal} />}
    </div>
  );
};

const StatCard = ({ title, count, amount, color }) => {
  const colorClass = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600'
  }[color] || 'text-gray-600';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {count !== null && <p className="text-2xl font-bold text-gray-900">{count}</p>}
      {amount !== null && <p className={`text-sm ${colorClass}`}>${amount.toFixed(2)}</p>}
    </div>
  );
};

export default AgentDashboard;
