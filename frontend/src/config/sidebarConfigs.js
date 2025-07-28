// src/config/sidebarConfigs.js
import { 
  Home, 
  Send, 
  CreditCard, 
  Store, 
  Receipt, 
  History, 
  User, 
  Plus, 
  Minus,
  BarChart3,
  Users,
  Settings,
  FileText,
  DollarSign,
  Briefcase
} from 'lucide-react';

export const personalSidebarConfig = {
  brandName: "Personal MFS",
  menuItems: [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'send-money', label: 'Send Money', icon: Send },
    { id: 'cash-out', label: 'Cash Out', icon: CreditCard },
    { id: 'merchant-payment', label: 'Pay Merchant', icon: Store },
    { id: 'bill-payment', label: 'Pay Bills', icon: Receipt },
    { id: 'transaction-history', label: 'Transaction History', icon: History },
    { id: 'profile', label: 'Profile', icon: User }
  ]
};

export const agentSidebarConfig = {
  brandName: "Agent MFS",
  menuItems: [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'cash-in', label: 'Cash In', icon: Plus },
    { id: 'cash-out', label: 'Cash Out', icon: Minus },
    { id: 'transaction-history', label: 'Transaction History', icon: History },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User }
  ]
};

export const merchantSidebarConfig = {
  brandName: "Merchant MFS",
  menuItems: [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'new-transaction', label: 'New Transaction', icon: DollarSign },
    { id: 'transaction-history', label: 'Transaction History', icon: History },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User }
  ]
};

export const billerSidebarConfig = {
  brandName: "Biller MFS",
  menuItems: [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'assign-bill', label: 'Assign Bill', icon: Receipt },
    { id: 'create-batch', label: 'Create Bill Batch', icon: Plus },
    { id: 'batch-management', label: 'Batch Management', icon: Settings },
    { id: 'bill-history', label: 'Bill History', icon: History },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ]
};

export const adminSidebarConfig = {
  brandName: "MFS Admin",
  menuItems: [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'balance', label: 'Balance Update', icon: CreditCard },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]
};
