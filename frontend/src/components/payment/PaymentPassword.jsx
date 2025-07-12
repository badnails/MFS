// src/components/payment/PaymentPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation} from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const PaymentPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {transactionId}= location.state || {};
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  useEffect(() => {
    if (!transactionId) {
        console.log("trx_id not found");
      navigate('/dashboard');
      return;
    }
  }, [transactionId, navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/PassCheck', {
        username: user.username,
        password: password,
        authFor: "TRX"
      });

      if (response.data.valid) {
        // Password verified, proceed to OTP verification
        handleConfirmPayment();

      } else {
        setAttempts(prev => prev + 1);
        if (attempts + 1 >= maxAttempts) {
          setError('Maximum attempts exceeded. Please try again later.');
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setError(`Invalid password. ${maxAttempts - attempts - 1} attempts remaining.`);
        }
        setPassword('');
      }
    } catch (err) {
      setAttempts(prev => prev + 1);
      if (attempts + 1 >= maxAttempts) {
        setError('Maximum attempts exceeded. Please try again later.');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setError(err.response?.data?.message || 'Invalid password. Please try again.');
      }
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!user) {
      setError('Missing user information');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/transaction/finalize-transaction', {
        transactionid: transactionId,
        accountid: user.accountid
      });

      if (response.data.valid) {
        // Navigate to completion page
        navigate('/payment-completion', {
          state: { transactionId }
        });
      } else {
        setError(response.data.error || 'Failed to process payment');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.response?.data?.error || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Security Verification</h2>
                <p className="text-indigo-100 text-sm">Enter your password to continue</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-indigo-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Transaction Info */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <Lock className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-indigo-900">Secure Payment Process</p>
                <p className="text-sm text-indigo-700">Transaction ID: {transactionId}</p>
              </div>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your password"
                  disabled={loading || attempts >= maxAttempts}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {attempts > 0 && attempts < maxAttempts && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ {maxAttempts - attempts} attempts remaining
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Authentication Failed</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || !password || attempts >= maxAttempts}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                  loading || !password || attempts >= maxAttempts
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:shadow-lg transform hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Verifying Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Verify Password
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel Payment
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-xs text-center">
              🔒 Your password is encrypted and never stored on our servers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPassword;