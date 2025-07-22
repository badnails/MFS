
// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import OTPVerification from './components/OTPVerification';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import PaymentComponent from './components/payment/PaymentComponent';
import PaymentCompletion from './components/payment/PaymentCompletion';
import { AuthProvider, useAuth } from './context/AuthContext';
import AgentDashboard from './components/agent/AgentDashboard';
import { ToastContainer } from 'react-toastify';
import PaymentPassword from './components/payment/PaymentPassword';
import PaymentOTP from './components/payment/PaymentOTP';
import BillerDashboard from './components/biller/BillerDashboard';
import PersonalAccountInfo from './components/PersonalAccountInfo';
import ContactInfo from './components/ContactInfo';
import Completion from './components/Completion';
import InstitutionalAccountInfo from './components/InstitutionalAccountInfo';
// In your main router file
import AccountSetupContainer from './components/AccountSetupContainer';

// Replace your current routing with:



function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/otp" element={<OTPVerification />} />
            <Route path="/signup" element={<Signup />} />
           
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute>
                <PaymentComponent />
              </ProtectedRoute>
            } />
            <Route path="/payment-pass" element={
              <ProtectedRoute>
                <PaymentPassword />
              </ProtectedRoute>
            } />
            <Route path="/payment-otp" element={
              <ProtectedRoute>
                <PaymentOTP />
              </ProtectedRoute>
            } />
            <Route
              path="/agent-dashboard"
              element={
                <ProtectedRoute>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/biller-dashboard"
              element={
                <ProtectedRoute>
                  <BillerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/payment-completion" element={<PaymentCompletion />} />
            <Route path="/" element={<Navigate to="/login" />} />
            
            <Route path="/account-setup" element={<AccountSetupContainer />} />
            <Route path="/completion" element={<Completion />} />
            

          </Routes>
        </div>
      <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default App;
