import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import BalanceUpdate from './admin/BalanceUpdate';
import AccountsManagement from './admin/AccountsManagement';
import TransactionsView from './admin/TransactionsView';
import AdminOverview from './admin/AdminOverview';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'balance':
        return <BalanceUpdate />;
      case 'accounts':
        return <AccountsManagement />;
      case 'transactions':
        return <TransactionsView />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Section */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        {/* <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
              >
                {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.accountname?.charAt(0) || 'A'}
                </div>
                <span className="text-sm text-gray-700">{user?.accountname}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </header> */}

        {/* Dynamic Component */}
        <main className="p-6">{renderActiveComponent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
