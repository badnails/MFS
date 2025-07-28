import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Shield, Calendar, Filter, Loader, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { 
  generateTimeIntervals, 
  getChartColors, 
  getDefaultChartConfig,
  mergeDataWithIntervals,
  aggregateByTimePeriod
} from './chartUtils';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AuthenticationChart = ({ height = 400 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [timePeriod, setTimePeriod] = useState('day'); // hour, day, week, month
  const [authType, setAuthType] = useState('all'); // all, PIN, TOTP, PASSWORD
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState({
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    successRate: 0
  });

  const colors = getChartColors();

  const fetchAuthenticationData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/admin/analytics/authentication', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: timePeriod,
          authType: authType
        }
      });

      if (response.data.valid) {
        setData(response.data.data);
        calculateSummary(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch authentication data');
      }
    } catch (err) {
      setError('Failed to fetch authentication data');
      console.error('Authentication data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (authData) => {
    const totalAttempts = authData.reduce((sum, item) => sum + item.successful_attempts + item.failed_attempts, 0);
    const successfulAttempts = authData.reduce((sum, item) => sum + item.successful_attempts, 0);
    const failedAttempts = authData.reduce((sum, item) => sum + item.failed_attempts, 0);
    const successRate = totalAttempts > 0 ? ((successfulAttempts / totalAttempts) * 100) : 0;
    
    setSummary({
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate: successRate.toFixed(1)
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
    const successData = mergeDataWithIntervals(intervals, data, 'successful_attempts');
    const failedData = mergeDataWithIntervals(intervals, data, 'failed_attempts');

    const chartConfig = {
      labels: successData.map(point => point.x),
      datasets: [
        {
          label: 'Successful Attempts',
          data: successData.map(point => point.y),
          backgroundColor: colors.secondary + 'CC',
          borderColor: colors.secondary,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Failed Attempts',
          data: failedData.map(point => point.y),
          backgroundColor: colors.quaternary + 'CC',
          borderColor: colors.quaternary,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    };

    setChartData(chartConfig);
  };

  useEffect(() => {
    fetchAuthenticationData();
  }, [dateRange, timePeriod, authType]);

  useEffect(() => {
    prepareChartData();
  }, [data, dateRange]);

  const chartOptions = {
    ...getDefaultChartConfig(),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...getDefaultChartConfig().plugins,
      tooltip: {
        ...getDefaultChartConfig().plugins.tooltip,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value}`;
          },
          afterBody: function(tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            const successful = successData[index]?.y || 0;
            const failed = failedData[index]?.y || 0;
            const total = successful + failed;
            const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : 0;
            return [`Total: ${total}`, `Success Rate: ${successRate}%`];
          }
        }
      }
    },
    scales: {
      ...getDefaultChartConfig().scales,
      y: {
        ...getDefaultChartConfig().scales.y,
        beginAtZero: true,
        ticks: {
          ...getDefaultChartConfig().scales.y.ticks,
          stepSize: 1,
          callback: function(value) {
            return Math.floor(value) === value ? value : '';
          }
        }
      }
    }
  };

  // Get success data for afterBody callback
  const successData = chartData ? chartData.datasets[0].data.map((val, idx) => ({ y: val, x: chartData.labels[idx] })) : [];

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePeriodChange = (period) => {
    setTimePeriod(period);
  };

  const handleAuthTypeChange = (type) => {
    setAuthType(type);
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
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Authentication Attempts</h3>
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
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="hour">Hourly</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>

          {/* Auth Type Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={authType}
              onChange={(e) => handleAuthTypeChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Types</option>
              <option value="PIN">PIN</option>
              <option value="TOTP">TOTP</option>
              <option value="PASSWORD">Password</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.totalAttempts}</p>
            <p className="text-sm text-gray-600">Total Attempts</p>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summary.successfulAttempts}</p>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{summary.failedAttempts}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.successRate}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center" style={{ height: height }}>
            <Loader className="h-8 w-8 animate-spin text-red-600" />
            <span className="ml-2 text-gray-600">Loading authentication data...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-lg" style={{ height: height }}>
            <p>{error}</p>
            <button
              onClick={fetchAuthenticationData}
              className="ml-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && chartData && (
          <div style={{ height: height }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}

        {!loading && !error && (!chartData || !data.length) && (
          <div className="flex flex-col items-center justify-center text-gray-500" style={{ height: height }}>
            <Shield className="h-12 w-12 mb-2" />
            <p>No authentication data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthenticationChart;
