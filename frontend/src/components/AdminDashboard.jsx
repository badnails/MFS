import React, { useState } from 'react';
import SidebarLayout from './layouts/SidebarLayout';
import BalanceUpdate from './admin/BalanceUpdate';
import AccountsManagement from './admin/AccountsManagement';
import TransactionsView from './admin/TransactionsView';
import AdminOverview from './admin/AdminOverview';
import { adminSidebarConfig } from '../config/sidebarConfigs';
import { Wallet } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleSidebarItemClick = (itemId) => {
    setActiveTab(itemId);
  };

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
    <SidebarLayout
      menuItems={adminSidebarConfig.menuItems}
      brandName={adminSidebarConfig.brandName}
      brandIcon={Wallet}
      onMenuItemClick={handleSidebarItemClick}
      activeMenuItem={activeTab}
    >
      {renderActiveComponent()}
    </SidebarLayout>
  );
};

export default AdminDashboard;
