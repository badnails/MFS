import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Calendar, Filter, Loader, TrendingUp, DollarSign } from 'lucide-react';
import axios from 'axios';
import { 
  generateTimeIntervals, 
  formatCurrency, 
  getChartColors, 
  getDefaultChartConfig,
  mergeDataWithIntervals,
  aggregateByTimePeriod
} from './chartUtils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TransactionVolumeChart = ({ accountId = null, height = 400 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [timePeriod, setTimePeriod] = useState('day'); // hour, day, week, month
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    totalFees: 0,
    averagePerDay: 0
  });

  const colors = getChartColors();

  const fetchTransactionData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = accountId 
        ? `/user/analytics/transactions/volume/${accountId}`
        : '/admin/analytics/transactions/volume';
      
      const response = await axios.get(endpoint, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: timePeriod
        }
      });

      if (response.data.valid) {
        setData(response.data.data);
        calculateSummary(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch transaction data');
      }
    } catch (err) {
      setError('Failed to fetch transaction data');
      console.error('Transaction volume fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (transactionData) => {
    const totalTransactions = transactionData.reduce((sum, item) => sum + item.count, 0);
    const totalAmount = transactionData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalFees = transactionData.reduce((sum, item) => sum + item.feesAmount, 0);
    const daysDiff = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) || 1;
    
    setSummary({
      totalTransactions,
      totalAmount,
      totalFees,
      averagePerDay: totalTransactions / daysDiff
    });
  };

  const prepareChartData = () => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    // Generate time intervals
    const intervals = generateTimeIntervals(dateRange.startDate, dateRange.endDate);
    
    // Merge data with intervals to ensure all time points are represented
    const amountData = mergeDataWithIntervals(intervals, data, 'totalAmount');
    const feesData = mergeDataWithIntervals(intervals, data, 'feesAmount');

    const chartConfig = {
      labels: amountData.map(point => point.x),
      datasets: [
        {
          label: 'Total Amount',
          data: amountData.map(point => point.y),
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Fees Amount',
          data: feesData.map(point => point.y),
          borderColor: colors.secondary,
          backgroundColor: colors.secondary + '20',
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.secondary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    };

    setChartData(chartConfig);
  };

  useEffect(() => {
    fetchTransactionData();
  }, [dateRange, timePeriod, accountId]);

  useEffect(() => {
    prepareChartData();
  }, [data, dateRange]);

  const chartOptions = {
    ...getDefaultChartConfig(),
    plugins: {
      ...getDefaultChartConfig().plugins,
      tooltip: {
        ...getDefaultChartConfig().plugins.tooltip,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      ...getDefaultChartConfig().scales,
      y: {
        ...getDefaultChartConfig().scales.y,
        ticks: {
          ...getDefaultChartConfig().scales.y.ticks,
          callback: function(value) {
            return formatCurrency(value);
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

  const handlePeriodChange = (period) => {
    setTimePeriod(period);
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Transaction Volume</h3>
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
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Time Period */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={timePeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hour">Hourly</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.totalTransactions}</p>
            <p className="text-sm text-gray-600">Total Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalFees)}</p>
            <p className="text-sm text-gray-600">Total Fees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.averagePerDay.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Avg per Day</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center" style={{ height: height }}>
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading transaction data...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-lg" style={{ height: height }}>
            <p>{error}</p>
            <button
              onClick={fetchTransactionData}
              className="ml-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && chartData && (
          <div style={{ height: height }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {!loading && !error && (!chartData || !data.length) && (
          <div className="flex flex-col items-center justify-center text-gray-500" style={{ height: height }}>
            <DollarSign className="h-12 w-12 mb-2" />
            <p>No transaction data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionVolumeChart;
