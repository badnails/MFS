// src/components/payment/PaymentConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, CheckCircle, DollarSign, AlertCircle, Loader2, CreditCard, User, Calendar, Hash, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Get transaction details from navigation state
  const { transactionId } = location.state || {};

  useEffect(() => {
    if (!transactionId || !user) {
      navigate('/dashboard');
      return;
    }
    fetchTransactionDetails();
  }, [transactionId, user, navigate]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/transaction/details/${transactionId}`);
      setTransactionDetails(response.data);
    } catch (err) {
      console.error('Failed to fetch transaction details:', err);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionDetails || !user) {
      setError('Missing transaction or user information');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post('/finalize-transaction', {
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
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
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

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'send-money': return 'Send Money';
      case 'cash-out': return 'Cash Out';
      case 'merchant-payment': return 'Merchant Payment';
      case 'bill-payment': return 'Bill Payment';
      default: return 'Payment';
    }
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'send-money': return 'from-blue-500 to-blue-600';
      case 'cash-out': return 'from-green-500 to-green-600';
      case 'merchant-payment': return 'from-purple-500 to-purple-600';
      case 'bill-payment': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error && !transactionDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleCancel}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getPaymentTypeColor(transactionDetails?.paymentType)} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Confirm Payment</h2>
              <p className="text-white/80 text-sm">Review and confirm your transaction</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-white/80 hover:text-white transition-colors"
              disabled={processing}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Ready to Process</h3>
            <p className="text-gray-600 text-sm">Please review the details below</p>
          </div>

          {/* Transaction Details */}
          {transactionDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Transaction Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Amount:</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency(transactionDetails.amount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Transaction Fee:</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transactionDetails.fee || 0)}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Total Amount:</span>
                    <span className="font-bold text-lg text-gray-900">
                      {formatCurrency((transactionDetails.amount || 0) + (transactionDetails.fee || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Transaction Info */}
          {transactionDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Transaction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Transaction ID:</span>
                  </div>
                  <span className="font-mono text-sm text-gray-900">
                    {transactionDetails.transactionId}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Type:</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {getPaymentTypeLabel(transactionDetails.paymentType)}
                  </span>
                </div>
                
                {transactionDetails.recipientName && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Recipient:</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {transactionDetails.recipientName}
                    </span>
                  </div>
                )}
                
                {transactionDetails.recipientAccount && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Account:</span>
                    </div>
                    <span className="font-mono text-sm text-gray-900">
                      {transactionDetails.recipientAccount}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Date:</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatDate(transactionDetails.createdAt)}
                  </span>
                </div>
                
                {transactionDetails.remainingBalance !== undefined && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Balance After:</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(transactionDetails.remainingBalance)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleConfirmPayment}
              disabled={processing || !transactionDetails}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                processing || !transactionDetails
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                'Confirm Payment'
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={processing}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;