// src/components/OTPVerification.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const tempData = sessionStorage.getItem('tempLoginData');
    if (!tempData) {
      navigate('/login');
      return;
    }
    setLoginData(JSON.parse(tempData));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginData) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/loginUserFin', {
        ...loginData,
        otp
      });

      const { token, user } = response.data;
      
      // Clear temporary data
      sessionStorage.removeItem('tempLoginData');
      
      // Login user
      login(token, user);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem('tempLoginData');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verify Your Identity
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Authentication Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength="6"
              className="input-field text-center text-2xl tracking-widest"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setOtp(value);
                setError('');
              }}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full btn-secondary flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;