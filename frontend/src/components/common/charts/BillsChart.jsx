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
import { FileText, Calendar, Filter, Loader, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { 
  generateTimeIntervals, 
  getChartColors, 
  getDefaultChartConfig,
  mergeDataWithIntervals,
  formatCurrency
} from './chartUtils';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BillsChart = ({ accountId, height = 400 }) => {
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
    totalBills: 0,
    paidBills: 0,
    unpaidBills: 0,
    totalAmount: 0,
    paidAmount: 0
  });

  const colors = getChartColors();
  
  // const billStatusIcons = {
  //   'paid': CheckCircle,
  //   'unpaid': Clock,
  //   'overdue': XCircle,
  //   'unassigned': AlertCircle
  // };

  const fetchBillsData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/biller/analytics/bills/${accountId}`, {
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
        setError(response.data.message || 'Failed to fetch bills data');
      }
    } catch (err) {
      setError('Failed to fetch bills data');
      console.error('Bills data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (billsData) => {
    const summary = billsData.reduce((acc, item) => {
      acc.totalBills += item.paid_bills + item.unpaid_bills;
      acc.paidBills += item.paid_bills;
      acc.unpaidBills += item.unpaid_bills;
      //acc.unassignedBills += item.unassigned_bills;
      acc.totalAmount += parseFloat(item.total_amount || 0);
      acc.paidAmount += parseFloat(item.paid_amount || 0);
      return acc;
    }, {
      totalBills: 0,
      paidBills: 0,
      unpaidBills: 0,

      totalAmount: 0,
      paidAmount: 0
    });
    
    setSummary(summary);
  };

  const prepareChartData = () => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    // Generate time intervals
    const intervals = generateTimeIntervals(dateRange.startDate, dateRange.endDate);
    
    // Merge data with intervals to ensure all time points are represented
    const paidData = mergeDataWithIntervals(intervals, data, 'paid_bills');
    const unpaidData = mergeDataWithIntervals(intervals, data, 'unpaid_bills');


    const chartConfig = {
      labels: paidData.map(point => point.x),
      datasets: [
        {
          label: 'Paid Bills',
          data: paidData.map(point => point.y),
          backgroundColor: colors.secondary + 'CC',
          borderColor: colors.secondary,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Unpaid Bills',
          data: unpaidData.map(point => point.y),
          backgroundColor: colors.tertiary + 'CC',
          borderColor: colors.tertiary,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        // {
        //   label: 'Unassigned Bills',
        //   data: unassignedData.map(point => point.y),
        //   backgroundColor: colors.quaternary + 'CC',
        //   borderColor: colors.quaternary,
        //   borderWidth: 1,
        //   borderRadius: 4,
        //   borderSkipped: false,
        // }
      ]
    };

    setChartData(chartConfig);
  };

  useEffect(() => {
    if (accountId) {
      fetchBillsData();
    }
  }, [dateRange, timePeriod, accountId]);

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
            const dataItem = data[index];
            if (dataItem) {
              return [
                `Total Bills: ${dataItem.paid_bills + dataItem.unpaid_bills}`,
                `Total Amount: ${formatCurrency(dataItem.total_amount || 0)}`,
                `Paid Amount: ${formatCurrency(dataItem.paid_amount || 0)}`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      ...getDefaultChartConfig().scales,
      y: {
        ...getDefaultChartConfig().scales.y,
        beginAtZero: true,
        stacked: true,
        ticks: {
          ...getDefaultChartConfig().scales.y.ticks,
          stepSize: 1,
          callback: function(value) {
            return Math.floor(value) === value ? value : '';
          }
        }
      },
      x: {
        ...getDefaultChartConfig().scales.x,
        stacked: true
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
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Bills Overview</h3>
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
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.totalBills}</p>
            <p className="text-sm text-gray-600">Total Bills</p>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{summary.paidBills}</p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-600">{summary.unpaidBills}</p>
              <p className="text-sm text-gray-600">Unpaid</p>
            </div>
          </div>
          {/* <div className="flex items-center justify-center space-x-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-center">
              <p className="text-xl font-bold text-red-600">{summary.unassignedBills}</p>
              <p className="text-sm text-gray-600">Unassigned</p>
            </div>
          </div> */}
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{formatCurrency(summary.paidAmount)}</p>
            <p className="text-sm text-gray-600">Paid Amount</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center" style={{ height: height }}>
            <Loader className="h-8 w-8 animate-spin text-orange-600" />
            <span className="ml-2 text-gray-600">Loading bills data...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center bg-red-50 text-red-600 p-4 rounded-lg" style={{ height: height }}>
            <p>{error}</p>
            <button
              onClick={fetchBillsData}
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
            <FileText className="h-12 w-12 mb-2" />
            <p>No bills data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsChart;
