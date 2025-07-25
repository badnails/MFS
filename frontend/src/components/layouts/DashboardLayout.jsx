import React,  { useState, useEffect, useRef } from 'react';
import { useDataReload } from '../hooks/useDataReload';
import { LogOut, User, ChevronDown, Settings, Contact, UserCircle, Key, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileComponent from './ProfileComponent';
import NotificationCenter from './NotificationCenter';
import ProfilePictureDisplay from './profile/ProfilePictureDisplay';


const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const reloadKey = useDataReload();
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isIndividualAccount = user?.accounttype === 'PERSONAL' || user?.accounttype === 'AGENT';

  const profileMenuItems = [
    {
      label: 'Profile Dashboard',
      icon: UserCircle,
      onClick: () => navigate('/profile'),
    },
    {
      label: 'Account Details',
      icon: FileText,
      onClick: () => navigate('/account-details'),
    },
    {
      label: 'Contact Information',
      icon: Contact,
      onClick: () => navigate('/profile/contact-info'),
    },
    {
      label: isIndividualAccount ? 'Personal Information' : 'Business Information',
      icon: User,
      onClick: () => navigate(isIndividualAccount ? '/profile/personal-info' : '/profile/institutional-info'),
    },
    {
      label: 'TOTP Recovery',
      icon: Key,
      onClick: () => navigate('/profile/totp-recovery'),
    },
  ];

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">
      {/* Profile Modal */}
      <ProfileComponent 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {user?.username} 
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-md"
                >
                  <ProfilePictureDisplay 
                    size="small" 
                    showEditButton={false}
                  />
                  <span className="text-sm">{user?.accountname}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      {profileMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            item.onClick();
                            setShowProfileDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <item.icon className="h-4 w-4 mr-3" />
                          {item.label}
                        </button>
                      ))}
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setShowProfile(true);
                          setShowProfileDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Legacy Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
        <DataReloadContext.Provider value={reloadKey}>
          {children}
        </DataReloadContext.Provider>
      </main>
    </div>
  );
};

export default DashboardLayout;