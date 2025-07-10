// src/components/Dashboard.jsx - Update to handle different account types
import React from 'react';
import { useAuth } from '../context/AuthContext';
import PersonalDashboard from './PersonalDashboard';
import AdminDashboard from './AdminDashboard';
import AgentDashboard from './agent/AgentDashboard';
import MerchantDashboard from './merchant/MerchantDashboard';
import { Bell } from 'lucide-react';
// Import other dashboard types as needed

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.accounttype) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'AGENT':
        return <AgentDashboard />;
      case 'PERSONAL':
        return <PersonalDashboard />;
      case 'MERCHANT':
        return <MerchantDashboard />;
      default:
        return <PersonalDashboard />;
    }
  };

  return renderDashboard();
};

export default Dashboard;
