// src/components/common/Sidebar.jsx
import React from 'react';
import { Menu, X, Wallet } from 'lucide-react';

const Sidebar = ({ 
  collapsed, 
  onToggle, 
  menuItems, 
  activeItem, 
  onItemClick, 
  brandName = "MFS",
  brandIcon = Wallet,
  className = ""
}) => {
  const BrandIcon = brandIcon;
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}>
        
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 bg-gray-900 text-white p-1.5 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-[60] border border-gray-600"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>

        {/* Brand/Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BrandIcon className="h-5 w-5 text-white" />
            </div>
            <div className={`transition-all duration-300 overflow-hidden ${
              collapsed ? 'opacity-0 w-0' : 'opacity-100'
            }`}>
              <h2 className="text-lg font-bold whitespace-nowrap">{brandName}</h2>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onItemClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                      collapsed ? 'opacity-0 w-0' : 'opacity-100'
                    }`}>
                      {item.label}
                    </span>
                    
                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer section (optional) */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs text-gray-400 text-center">
              © 2025 {brandName}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
