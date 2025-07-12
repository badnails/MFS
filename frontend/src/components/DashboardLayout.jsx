// src/components/DashboardLayout.jsx
import React, { useState } from 'react';
import { LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationModal from './NotificationModal';


const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const userType = user?.accounttype?.toLowerCase(); // "admin", "agent", "merchant"

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {user?.accounttype} Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setShowNotifications(true)} className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.accountname}</span>
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
        {children}
      </main>

      {/* Notification Modal */}
      {showNotifications && (
        <NotificationModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;


// // src/components/DashboardLayout.jsx
// import React, { useState } from 'react';
// import { LogOut, User, Bell } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import NotificationModal from './NotificationModal'; // your modal from earlier
// import FloatingBackground from '../components/FloatingBackground';


// const DashboardLayout = ({ children }) => {
//   const { user, logout } = useAuth();
//   const [showNotifications, setShowNotifications] = useState(false);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center space-x-4">
//               <h1 className="text-xl font-semibold text-gray-900">
//                 {user?.accounttype} Dashboard
//               </h1>
//             </div>
//             <div className="flex items-center space-x-4">
//               <button onClick={() => setShowNotifications(true)} className="relative">
//                 <Bell className="h-6 w-6 text-gray-600" />
//               </button>
//               <div className="flex items-center space-x-2">
//                 <User className="h-5 w-5 text-gray-400" />
//                 <span className="text-sm text-gray-700">{user?.accountname}</span>
//               </div>
//               <button
//                 onClick={logout}
//                 className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
//               >
//                 <LogOut className="h-5 w-5" />
//                 <span className="text-sm">Logout</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         {children}
//       </main>

//       {/* Notification Modal */}
//       {showNotifications && (
//         <NotificationModal onClose={() => setShowNotifications(false)} />
//       )}
//     </div>
//   );
// };

// export default DashboardLayout;
