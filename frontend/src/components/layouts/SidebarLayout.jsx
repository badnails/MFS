// src/components/layouts/SidebarLayout.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useDataReload, DataReloadContext } from "../../hooks/useDataReload";
import { LogOut, User } from "lucide-react";
import NotificationCenter from "../common/NotificationCenter";
import Sidebar from "../common/Sidebar";
import { useSidebar } from "../../hooks/useSidebar";

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

  const defaultHeaderTitle = `${user?.accounttype} Dashboard`;
  const displayTitle = headerTitle || defaultHeaderTitle;
  const reloadKey = useDataReload();

  const defaultHeaderActions = (
    <>
      <NotificationCenter />
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-700">{user?.username}</span>
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
