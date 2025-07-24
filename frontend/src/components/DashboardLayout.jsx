import React,  { useState } from 'react';
import { useDataReload } from '../hooks/useDataReload';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileComponent from './ProfileComponent';
import NotificationCenter from './NotificationCenter';


const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const reloadKey = useDataReload();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">
      {/* Profile Modal */}
      <ProfileComponent 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {user?.accounttype} Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-sm">{user?.accountname}</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {React.cloneElement(children, { reloadKey })}
      </main>
    </div>
  );
};

export default DashboardLayout;