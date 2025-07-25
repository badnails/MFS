// src/components/layouts/SidebarLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useDataReload, DataReloadContext } from "../../hooks/useDataReload";
import { LogOut, User, ChevronDown, Settings, Contact, UserCircle, Key, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "../common/NotificationCenter";
import Sidebar from "../common/Sidebar";
import { useSidebar } from "../../hooks/useSidebar";
import ProfileComponent from "../ProfileComponent";
import ProfilePictureDisplay from "../profile/ProfilePictureDisplay";

const SidebarLayout = ({
  children,
  menuItems = [],
  brandName,
  brandIcon,
  onMenuItemClick,
  activeMenuItem,
  showHeader = true,
  headerTitle,
  headerActions,
  customHeader,
}) => {
  const { user, logout } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
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

  const defaultHeaderTitle = `${user?.accounttype} Dashboard`;
  const displayTitle = headerTitle || defaultHeaderTitle;
  const reloadKey = useDataReload();

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

  const defaultHeaderActions = (
    <>
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
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        <LogOut className="h-4 w-4" />
        <span className="text-sm">Logout</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Profile Modal */}
      <ProfileComponent 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

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
      <div
        className={`flex-1 transition-all duration-300 relative z-10 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Header */}
        {showHeader && (
          <header className="bg-white shadow-sm border-b border-gray-200 relative z-20">
            {customHeader ? (
              customHeader
            ) : (
              <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900 capitalize">
                    {displayTitle}
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  {headerActions || defaultHeaderActions}
                </div>
              </div>
            )}
          </header>
        )}

        {/* Page Content */}
        <main className="p-6">
          <DataReloadContext.Provider value={reloadKey}>
            {children}
          </DataReloadContext.Provider>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
