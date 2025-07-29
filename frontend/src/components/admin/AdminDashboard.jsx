import React, { useState } from 'react';
import SidebarLayout from '../layouts/SidebarLayout';
import BalanceUpdate from './BalanceUpdate';
import AccountsManagement from './AccountsManagement';
import AdminTransactionHistory from './AdminTransactionHistory';
import AdminOverview from './AdminOverview';
import FloatRequestsManagement from './FloatRequestsManagement';
import { adminSidebarConfig } from '../../config/sidebarConfigs';
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
      case 'float-requests':
        return <FloatRequestsManagement />;
      case 'accounts':
        return <AccountsManagement />;
      case 'transactions':
        return <AdminTransactionHistory />;
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
