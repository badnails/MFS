// src/components/payment/PaymentOTP.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const PaymentOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {transactionId} = location.state || {};
  
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const maxAttempts = 3;

  useEffect(() => {
    if (!transactionId) {
      navigate('/dashboard');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('OTP session expired. Please restart the payment process.');
          setTimeout(() => navigate('/dashboard'), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [transactionId, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOTP(value);
      setError('');
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/check-otp', {
        username: user.username,
        otp: otp
      });

      if (response.data.success) {
        // OTP verified, proceed to confirmation
        navigate(`/payment-confirmation?transactionid=${transactionId}`);
      } else {
        setAttempts(prev => prev + 1);
        if (attempts + 1 >= maxAttempts) {
          setError('Maximum attempts exceeded. Please try again later.');
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setError(`Invalid OTP. ${maxAttempts - attempts - 1} attempts remaining.`);
        }
        setOTP('');
      }
    } catch (err) {
      setAttempts(prev => prev + 1);
      if (attempts + 1 >= maxAttempts) {
        setError('Maximum attempts exceeded. Please try again later.');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      }
      setOTP('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post('/resend-otp', {
        username: user.username
      });
      setTimeLeft(300); // Reset timer
      setAttempts(0); // Reset attempts
      setError('');
      setOTP('');
    } catch (err) {
        
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (transactionId) {
      try {
        // Cancel the transaction by setting status to FAILED
        await axios.post('/transaction/cancel', {
          transactionid: transactionId
        });
        console.log('Transaction cancelled successfully');
      } catch (err) {
        console.error('Failed to cancel transaction:', err);
        // Even if cancellation fails, we still navigate away
      }
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">OTP Verification</h2>
                <p className="text-emerald-100 text-sm">Enter the 6-digit code</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-emerald-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Transaction Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">Two-Factor Authentication</p>
                  <p className="text-sm text-emerald-700">Transaction ID: {transactionId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-700">Time remaining</p>
                <p className="font-mono font-bold text-emerald-900">{formatTime(timeLeft)}</p>
              </div>
            </div>
          </div>

          {/* OTP Instructions */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm text-center">
              Enter the 6-digit verification code from your authenticator app
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleOTPSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={handleOTPChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  disabled={loading || attempts >= maxAttempts || timeLeft <= 0}
                />
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
                  <p className="text-red-800 font-medium">Verification Failed</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || !otp || otp.length !== 6 || attempts >= maxAttempts || timeLeft <= 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                  loading || !otp || otp.length !== 6 || attempts >= maxAttempts || timeLeft <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg transform hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Verify OTP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading || timeLeft > 240} // Allow resend after 1 minute
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  loading || timeLeft > 240
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Resend OTP {timeLeft > 240 && `(${Math.ceil((timeLeft - 240) / 60)}m)`}
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
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs text-center">
              🔒 This code expires in {formatTime(timeLeft)} for your security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOTP;