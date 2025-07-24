// src/components/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import PersonalDashboard from './PersonalDashboard';
import AdminDashboard from './AdminDashboard';
import AgentDashboard from './agent/AgentDashboard';
import MerchantDashboard from './merchant/MerchantDashboard';
import DashboardLayout from './DashboardLayout';
import BillerDashboard from './biller/BillerDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.accounttype) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'AGENT':
        return <AgentDashboard />;
      case 'MERCHANT':
        return <MerchantDashboard />;
      case 'PERSONAL':
        return <PersonalDashboard />;
      case 'BILLER':
        return <BillerDashboard />
      default:
        return <PersonalDashboard />;
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;
