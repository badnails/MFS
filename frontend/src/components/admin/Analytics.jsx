import React from 'react';
import TransactionVolumeChart from '../common/charts/TransactionVolumeChart';
import TransactionStatusChart from '../common/charts/TransactionStatusChart';
import AuthenticationChart from '../common/charts/AuthenticationChart';
import { BarChart3 } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">System-wide analytics and insights</p>
        </div>
      </div>

      {/* Transaction Volume Chart */}
      <div className="mb-8">
        <TransactionVolumeChart height={400} />
      </div>

      {/* Two column layout for status and authentication charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Transaction Status Chart */}
        <div>
          <TransactionStatusChart height={400} />
        </div>

        {/* Authentication Chart */}
        <div>
          <AuthenticationChart height={400} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
