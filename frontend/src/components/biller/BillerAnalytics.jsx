import React from 'react';
import { useAuth } from '../../context/AuthContext';
import BillsChart from '../common/charts/BillsChart';
import { BarChart3 } from 'lucide-react';

const BillerAnalytics = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biller Analytics</h1>
          <p className="text-gray-600">Insights into your billing operations and bill status</p>
        </div>
      </div>

      {/* Bills Chart */}
      <div>
        <BillsChart accountId={user?.accountid} height={400} />
      </div>
    </div>
  );
};

export default BillerAnalytics;
