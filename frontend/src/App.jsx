
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
            <Route
              path="/agent-dashboard"
              element={
                <ProtectedRoute>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/payment-completion" element={<PaymentCompletion />} />
            <Route path="/" element={<Navigate to="/login" />} />
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
