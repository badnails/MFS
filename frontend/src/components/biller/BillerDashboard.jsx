import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataReloadContext } from '../../hooks/useDataReload';
import { RefreshCw, Plus, Receipt, Calendar, ChevronDown, Search } from 'lucide-react';
import CreateBillBatch from './CreateBillBatch';
import AssignBill from './AssignBill';
import BillerAnalytics from './BillerAnalytics';
import BillBatchManagement from './BillBatchManagement';
import BillManagement from './BillManagement';
import TransactionHistory from '../common/TransactionHistory';
import SidebarLayout from '../layouts/SidebarLayout';
import { billerSidebarConfig } from '../../config/sidebarConfigs';
import { Wallet } from 'lucide-react';
import axios from 'axios';

const BillerDashboardContent = ({ activeView, activeModal, setActiveModal }) => {
  const { user } = useAuth();
  const reloadKey = useDataReloadContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billerData, setBillerData] = useState({
    totalBills: 0,
    paidBills: 0,
    unpaidBills: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [lastCardStat, setLastCardStat] = useState('total'); // 'total', 'paid', 'unpaid'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const fetchBillerData = async () => {
      try {
        setLoading(true);
        const statsRes = await axios.get('/biller/stats', {
          params: {
            timeRange: selectedTimeRange,
            startDate: selectedTimeRange === 'custom' ? customDateRange.startDate : '',
            endDate: selectedTimeRange === 'custom' ? customDateRange.endDate : ''
          }
        });
        setBillerData(statsRes.data);
        setError('');
      } catch (err) {
        setError('Failed to load biller data');
        console.error('Biller dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data automatically for non-custom ranges
    if (selectedTimeRange !== 'custom') {
      fetchBillerData();
    }
  }, [reloadKey, selectedTimeRange, customDateRange.startDate, customDateRange.endDate]);

  const openModal = (id) => setActiveModal(id);
  const closeModal = () => {
    setActiveModal(null);
  };

  const quickActions = [
    { id: 'assign-bill', title: 'Assign Bill', icon: Receipt, color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
    { id: 'create-batch', title: 'Create Bill Batch', icon: Plus, color: 'bg-green-500', hover: 'hover:bg-green-600' }
  ];

  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last3days', label: 'Last 3 Days' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
    setError(''); // Clear any previous errors
    if (range !== 'custom') {
      setShowDatePicker(false);
      setCustomDateRange({ startDate: '', endDate: '' });
    } else {
      setShowDatePicker(true);
    }
  };

  const handleCustomDateChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomDateSearch = async () => {
    if (!customDateRange.startDate || !customDateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (new Date(customDateRange.startDate) > new Date(customDateRange.endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const statsRes = await axios.get('/biller/stats', {
        params: {
          timeRange: selectedTimeRange,
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate
        }
      });
      setBillerData(statsRes.data);
    } catch (err) {
      setError('Failed to load biller data');
      console.error('Biller dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLastCardValue = () => {
    switch (lastCardStat) {
      case 'paid':
        return billerData.paidAmount;
      case 'unpaid':
        return billerData.unpaidAmount;
      default:
        return billerData.totalAmount;
    }
  };

  const getLastCardTitle = () => {
    switch (lastCardStat) {
      case 'paid':
        return 'Paid Amount';
      case 'unpaid':
        return 'Unpaid Amount';
      default:
        return 'Total Amount';
    }
  };

  const getLastCardColor = () => {
    switch (lastCardStat) {
      case 'paid':
        return 'green';
      case 'unpaid':
        return 'red';
      default:
        return 'purple';
    }
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return renderDashboardContent();
      case 'bill-history':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Bill History</h2>
            </div>
            <div className="p-6">
              <TransactionHistory 
                accountId={user?.accountid} 
                isModal={false} 
              />
            </div>
          </div>
        );
      case 'analytics':
        return <BillerAnalytics />;
      case 'batch-management':
        return <BillBatchManagement />;
      case 'bill-management':
        return <BillManagement />;
      case 'stats':
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Statistics</h2>
                
                {/* Time Range Selector */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select
                      value={selectedTimeRange}
                      onChange={(e) => handleTimeRangeChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {timeRangeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {/* Custom Date Range Picker */}
                  {showDatePicker && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={customDateRange.startDate}
                        onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Start Date"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={customDateRange.endDate}
                        onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="End Date"
                      />
                      <button
                        onClick={handleCustomDateSearch}
                        disabled={!customDateRange.startDate || !customDateRange.endDate || loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Bills" count={billerData.totalBills} amount={null} color="blue" />
                <StatCard title="Paid Bills" count={billerData.paidBills} amount={null} color="green" />
                <StatCard title="Unpaid Bills" count={billerData.unpaidBills} amount={null} color="orange" />
                
                {/* Switchable Last Card */}
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <div className="relative">
                      <select
                        value={lastCardStat}
                        onChange={(e) => setLastCardStat(e.target.value)}
                        className="appearance-none bg-white bg-opacity-90 border border-gray-200 rounded-md px-2 py-1 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="total">Total</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <StatCard 
                    title={getLastCardTitle()} 
                    count={null} 
                    amount={getLastCardValue()} 
                    color={getLastCardColor()} 
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => window.location.reload()} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Biller Stats Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard Overview</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {timeRangeOptions.find(option => option.value === selectedTimeRange)?.label || 'Today'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Bills" count={billerData.totalBills} amount={null} color="blue" />
        <StatCard title="Paid Bills" count={billerData.paidBills} amount={null} color="green" />
        <StatCard title="Unpaid Bills" count={billerData.unpaidBills} amount={null} color="orange" />
        
        {/* Switchable Last Card in Dashboard */}
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <div className="relative">
              <select
                value={lastCardStat}
                onChange={(e) => setLastCardStat(e.target.value)}
                className="appearance-none bg-white bg-opacity-90 border border-gray-200 rounded-md px-2 py-1 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="total">Total</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <StatCard 
            title={getLastCardTitle()} 
            count={null} 
            amount={getLastCardValue()} 
            color={getLastCardColor()} 
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map(({ id, title, icon: Icon, color, hover }) => ( // eslint-disable-line no-unused-vars
            <button
              key={id}
              onClick={() => openModal(id)}
              className={`${color} ${hover} text-white p-6 rounded-xl transition transform hover:scale-105 shadow`}
            >
              <div className="flex items-center justify-center">
                <Icon className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm opacity-90">
                    {id === 'assign-bill' ? 'Assign bills to customers' : 'Create bulk bill batches'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <TransactionHistory 
              accountId={user?.accountid} 
              isModal={false} 
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {renderMainContent()}

      {/* Modals */}
      {activeModal === 'assign-bill' && <AssignBill onClose={closeModal} />}
      {activeModal === 'create-batch' && <CreateBillBatch onClose={closeModal} />}
    </>
  );
};

const BillerDashboard = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  const handleSidebarItemClick = (itemId) => {
    setActiveView(itemId);
    if (['assign-bill', 'create-batch'].includes(itemId)) {
      setActiveModal(itemId);
      setActiveView('dashboard'); // Keep dashboard view when opening modals
    }
  };

  return (
    <SidebarLayout
      menuItems={billerSidebarConfig.menuItems}
      brandName={billerSidebarConfig.brandName}
      brandIcon={Wallet}
      onMenuItemClick={handleSidebarItemClick}
      activeMenuItem={activeView}
    >
      <BillerDashboardContent 
        activeView={activeView}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />
    </SidebarLayout>
  );
};

const StatCard = ({ title, count, amount, color }) => {
  const colorClass = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
  }[color] || 'text-gray-600';

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {count !== null && <p className="text-2xl font-bold text-gray-900">{count}</p>}
      {amount !== null && <p className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(amount)}</p>}
    </div>
  );
};

export default BillerDashboard;
