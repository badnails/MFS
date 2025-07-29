import React from 'react';
import { useAuth } from '../../context/AuthContext';
import TransactionVolumeChart from '../common/charts/TransactionVolumeChart';
import TransactionStatusChart from '../common/charts/TransactionStatusChart';
import { BarChart3 } from 'lucide-react';

const PersonalAnalytics = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Transaction Analytics</h1>
          <p className="text-gray-600">Insights into your transaction history and patterns</p>
        </div>
      </div>

      {/* Transaction Volume Chart */}
      <div className="mb-8">
        <TransactionVolumeChart accountId={user?.accountid} height={400} />
      </div>

      {/* Transaction Status Chart */}
      <div>
        <TransactionStatusChart accountId={user?.accountid} height={400} />
      </div>
    </div>
  );
};

export default PersonalAnalytics;
