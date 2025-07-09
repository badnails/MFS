// src/components/payment/PaymentCompletion.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, RefreshCw } from 'lucide-react';
import axios from 'axios';

const PaymentCompletion = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transactionid');
  
  const [paymentStatus, setPaymentStatus] = useState('checking'); // checking, success, failed
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);
  const maxPollingAttempts = 30; // 30 attempts = 30 seconds

  useEffect(() => {
    if (!transactionId) {
      navigate('/dashboard');
      return;
    }
    
    startPolling();
  }, [transactionId, navigate]);

  const checkPaymentStatus = async () => {
    try {
      const response = await axios.get(`/transaction/status/${transactionId}`);
      const { status, transaction } = response.data;
      
      setTransactionDetails(transaction);
      
      if (status === 'COMPLETED' || status === 'SUCCESS') {
        setPaymentStatus('success');
        return true; // Stop polling
      } else if (status === 'PENDING' || status === 'CANCELLED') {
        setPaymentStatus('failed');
        return true; // Stop polling
      }
      
      return false; // Continue polling
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (pollingCount >= maxPollingAttempts - 1) {
        setPaymentStatus('failed');
        return true; // Stop polling after max attempts
      }
      return false; // Continue polling
    }
  };

  const startPolling = async () => {
    const shouldStop = await checkPaymentStatus();
    
    if (!shouldStop && pollingCount < maxPollingAttempts) {
      setPollingCount(prev => prev + 1);
      setTimeout(startPolling, 1000); // Poll every second
    } else if (pollingCount >= maxPollingAttempts && paymentStatus === 'checking') {
      setPaymentStatus('failed');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackToHome = () => {
    navigate('/dashboard');
  };

  const handleRetry = () => {
    setPaymentStatus('checking');
    setPollingCount(0);
    startPolling();
  };

  if (paymentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h2>
          <p className="text-gray-600 mb-6">
            Please wait while we confirm your payment...
          </p>
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Transaction ID: <span className="font-mono">{transactionId}</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Checking status... ({pollingCount + 1}/{maxPollingAttempts})
            </p>
          </div>
          <button
            onClick={handleBackToHome}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel & Go Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully.
          </p>
          
          {transactionDetails && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-green-800 mb-3">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Amount:</span>
                  <span className="font-medium">{formatCurrency(transactionDetails.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">To:</span>
                  <span className="font-medium">{transactionDetails.recipientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Date:</span>
                  <span className="font-medium">{formatDate(transactionDetails.completedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Transaction ID:</span>
                  <span className="font-mono text-xs">{transactionId}</span>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleBackToHome}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            We couldn't process your payment. Please try again or contact support.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              Transaction ID: <span className="font-mono">{transactionId}</span>
            </p>
            {transactionDetails?.errorMessage && (
              <p className="text-sm text-red-800 mt-2">
                Error: {transactionDetails.errorMessage}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Check Status Again
            </button>
            <button
              onClick={handleBackToHome}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentCompletion;
