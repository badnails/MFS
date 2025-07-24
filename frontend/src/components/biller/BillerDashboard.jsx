import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Plus, UserPlus, History, RefreshCw, Receipt } from 'lucide-react';
import CreateBillBatch from './CreateBillBatch';
import AssignBill from './AssignBill';
import TransactionHistory from '../common/TransactionHistory';
import axios from 'axios';

const BillerDashboard = ({ reloadKey }) => {
  const { user, logout } = useAuth();
  const [billerData, setBillerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [todayStats, setTodayStats] = useState({
    totalBills: 0,
    assignedBills: 0,
    unassignedBills: 0,
    totalAmount: 0
  });

  useEffect(() => {
    const fetchBillerData = async () => {
      try {
        setLoading(true);
        const [billerRes, statsRes] = await Promise.all([
          axios.get('/biller/dashboard'),
          axios.get('/biller/stats/today')
        ]);
        setBillerData(billerRes.data);
        setTodayStats(statsRes.data);
        setError('');
      } catch (err) {
        setError('Failed to load biller data');
      } finally {
        setLoading(false);
      }
    };

    fetchBillerData();
  }, [reloadKey]);

  const handleLogout = () => logout();
  const openModal = (id) => setActiveModal(id);
  const closeModal = () => {
    setActiveModal(null);
    axios.get('/biller/dashboard').then(res => setBillerData(res.data));
    axios.get('/biller/stats/today').then(res => setTodayStats(res.data));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const quickActions = [
    { id: 'create-batch', title: 'Create Bill Batch', icon: Plus, color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
    { id: 'assign-bill', title: 'Assign Bill', icon: UserPlus, color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
    { id: 'history', title: 'Bill History', icon: History, color: 'bg-green-500', hover: 'hover:bg-green-600' }
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
      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded">
            {error} <button onClick={() => window.location.reload()} className="underline ml-2">Retry</button>
          </div>
        )}

        {/* Total Amount Box */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg">Total Bill Amount</h2>
              <p className="text-3xl font-bold">{formatCurrency(billerData?.totalAmount || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">This Month</p>
              <p className="text-xl font-semibold">{formatCurrency(billerData?.monthlyAmount || 0)}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Bills Created" value={todayStats.totalBills} color="blue" />
          <StatCard title="Assigned Bills" value={todayStats.assignedBills} color="green" />
          <StatCard title="Unassigned Bills" value={todayStats.unassignedBills} color="orange" />
          <StatCard
            title="Assign Rate"
            value={
              todayStats.totalBills > 0
                ? `${Math.round((todayStats.assignedBills / todayStats.totalBills) * 100)}%`
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

        {/* Recent Batches */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 flex justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Recent Bill Batches</h3>
              <p className="text-sm text-gray-500">Latest biller activity</p>
            </div>
            <button
              onClick={() => openModal('history')}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              View All
            </button>
          </div>
          <div className="border-t">
            {billerData?.recentBatches?.length ? (
              <ul className="divide-y">
                {billerData.recentBatches.slice(0, 5).map((batch, idx) => (
                  <li key={idx} className="px-4 py-4 flex justify-between">
                    <div>
                      <p className="text-sm font-medium">Batch #{batch.batchId}</p>
                      <p className="text-sm text-gray-500">{batch.billCount} bills</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {formatCurrency(batch.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                No batches created yet
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === 'create-batch' && <CreateBillBatch onClose={closeModal} />}
      {activeModal === 'assign-bill' && <AssignBill onClose={closeModal} />}
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

export default BillerDashboard;
