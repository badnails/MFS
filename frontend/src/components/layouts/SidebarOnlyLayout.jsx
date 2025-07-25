// src/components/layouts/SidebarOnlyLayout.jsx
import React from 'react';
import Sidebar from '../common/Sidebar';
import { useSidebar } from '../../hooks/useSidebar';

const SidebarOnlyLayout = ({ 
  children, 
  menuItems = [], 
  brandName,
  brandIcon,
  onMenuItemClick,
  activeMenuItem,
  className = ""
}) => {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <div className="relative flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        menuItems={menuItems}
        activeItem={activeMenuItem}
        onItemClick={onMenuItemClick}
        brandName={brandName}
        brandIcon={brandIcon}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 relative z-10 ${collapsed ? 'ml-16' : 'ml-64'} ${className}`}>
        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarOnlyLayout;
