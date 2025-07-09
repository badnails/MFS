// src/components/admin/AdminOverview.jsx
import React, { useState, useEffect } from 'react';
import { Users, CreditCard, TrendingUp, Activity } from 'lucide-react';
import axios from 'axios';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalBalance: 0,
    recentTransactions: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // You'll need to create these endpoints in your backend
      const accountsRes = await axios.get('/admin/accountsummary');
        
  
      
      setStats({
        totalAccounts: accountsRes.data.totalAccounts || 0,
        totalBalance: accountsRes.data.totalBalance || 0,
        recentTransactions: accountsRes.data.recentCount || 0,
        activeUsers: accountsRes.data.activeUsers || 0
      });
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Accounts',
      value: stats.totalAccounts,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Balance',
      value: formatCurrency(stats.totalBalance),
      icon: CreditCard,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Recent Transactions',
      value: stats.recentTransactions,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+23%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to the admin dashboard. Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <CreditCard className="h-8 w-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Update Balance</h4>
            <p className="text-sm text-gray-600">Modify user account balances</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Accounts</h4>
            <p className="text-sm text-gray-600">View and manage user accounts</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Activity className="h-8 w-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">View Transactions</h4>
            <p className="text-sm text-gray-600">Monitor all system transactions</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;