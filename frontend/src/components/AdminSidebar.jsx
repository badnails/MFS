// src/components/AdminSidebar.jsx
import React from 'react';
import { BarChart3, Users, CreditCard, History, Settings, Wallet } from 'lucide-react';

const AdminSidebar = ({ collapsed, activeTab, setActiveTab, toggleSidebar }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'balance', label: 'Balance Update', icon: CreditCard },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: History },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className={`transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <h2 className="text-lg font-bold">MFS Admin</h2>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`transition-all duration-300 ${
                    collapsed ? 'opacity-0 w-0' : 'opacity-100'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;