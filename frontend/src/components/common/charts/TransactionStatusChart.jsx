import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { PieChart, Calendar, Loader, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { 
  formatCurrency, 
  getStatusColors, 
  calculatePercentages,
  getDefaultChartConfig
} from './chartUtils';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const TransactionStatusChart = ({ accountId = null, height = 400 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalAmount: 0
  });

  const statusColors = getStatusColors();
  const statusIcons = {
    'COMPLETED': CheckCircle,
    'PENDING': Clock,
    'FAILED': XCircle,
    'FAILED_TIMEOUT': AlertTriangle
  };

  const fetchStatusData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = accountId 
        ? `user/analytics/transactions/status/${accountId}`
        : '/admin/analytics/transactions/status';
      
      const response = await axios.get(endpoint, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });

      if (response.data.valid) {
        const statusData = response.data.data;
        setData(statusData);
        calculateSummary(statusData);
      } else {
        setError(response.data.message || 'Failed to fetch status data');
      }
    } catch (err) {
      setError('Failed to fetch transaction status data');
      console.error('Transaction status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (statusData) => {
    const totalTransactions = statusData.reduce((sum, item) => sum + parseInt(item.count), 0);
    const totalAmount = statusData.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    
    setSummary({
      totalTransactions,
      totalAmount
    });
  };

  const prepareChartData = () => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    // Calculate percentages
    const dataWithPercentages = calculatePercentages(data, 'count');

    // Prepare chart data
    const labels = dataWithPercentages.map(item => item.status);
    const values = dataWithPercentages.map(item => parseInt(item.count));
    const colors = labels.map(status => statusColors[status] || '#9CA3AF');

    const chartConfig = {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color + 'CC'),
          borderWidth: 2,
          hoverOffset: 4,
          hoverBorderWidth: 3,
          hoverBorderColor: '#fff'
        }
      ]
    };

    setChartData(chartConfig);
  };

  useEffect(() => {
    fetchStatusData();
  }, [dateRange, accountId]);

  useEffect(() => {
    prepareChartData();
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          generateLabels: function(chart) {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return original.map((label, index) => {
              const dataItem = data[index];
              if (dataItem) {
                const percentage = calculatePercentages(data, 'count')[index]?.percentage || 0;
                label.text = `${label.text}: ${dataItem.count} (${percentage}%)`;
              }
              return label;
            });
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const dataItem = data[context.dataIndex];
            const percentage = calculatePercentages(data, 'count')[context.dataIndex]?.percentage || 0;
            const amount = formatCurrency(dataItem?.total_amount || 0);
            return [
              `Count: ${context.parsed}`,
              `Percentage: ${percentage}%`,
              `Total Amount: ${amount}`
            ];
          }
        }
      }
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickDateRange = (days) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Transaction Status Distribution</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Quick Date Ranges */}
          <div className="flex items-center space-x-1">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => handleQuickDateRange(days)}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.totalTransactions}</p>
            <p className="text-sm text-gray-600">Total Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Chart and Status Breakdown */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center" style={{ height: height }}>
            <Loader className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading status data...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-lg" style={{ height: height }}>
            <p>{error}</p>
            <button
              onClick={fetchStatusData}
              className="ml-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <div className="lg:col-span-2">
              <div style={{ height: height }}>
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h4>
              {data.map((item, index) => {
                const StatusIcon = statusIcons[item.status] || CheckCircle;
                const percentage = calculatePercentages(data, 'count')[index]?.percentage || 0;
                
                return (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <StatusIcon 
                        className="h-5 w-5" 
                        style={{ color: statusColors[item.status] || '#9CA3AF' }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.status}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.total_amount || 0)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-600">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && !error && (!chartData || !data.length) && (
          <div className="flex flex-col items-center justify-center text-gray-500" style={{ height: height }}>
            <PieChart className="h-12 w-12 mb-2" />
            <p>No transaction status data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionStatusChart;
