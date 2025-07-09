// src/components/payment/PaymentComponent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, DollarSign, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const PaymentComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  
  // Get payment details from navigation state
  const { 
    recipientId, 
    recipientName, 
    paymentType, 
    description 
  } = location.state || {};

  useEffect(() => {
    if (!recipientId || !paymentType) {
      navigate('/dashboard');
      return;
    }
    fetchUserBalance();
  }, [recipientId, paymentType, navigate]);

  const fetchUserBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await axios.get('/user/balance');
      setUserBalance(parseFloat(response.data.availableBalance));
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError('Failed to load account balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const checkSufficientBalance = () => {
    const paymentAmount = parseFloat(amount);
    return paymentAmount > 0 && paymentAmount <= userBalance;
  };

  const handlePayment = async () => {
    const paymentAmount = parseFloat(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!checkSufficientBalance()) {
      setError('Insufficient balance for this transaction');
      return;
    }

    setLoading(true);
    try {
      // Use new initiate endpoint
      const response = await axios.post('/transaction/initiate', {
        recipientId,
        amount: paymentAmount,
        paymentType,
        description
      });

      const { transactionId } = response.data;
      
      // Redirect to dummy payment URL with transaction ID
      const paymentUrl = `https://dummy-payment-gateway.com/pay?transactionId=${transactionId}&amount=${paymentAmount}&returnUrl=${encodeURIComponent(window.location.origin + '/payment-completion')}`;
      
      window.location.href = paymentUrl;
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case 'send-money': return 'Send Money';
      case 'cash-out': return 'Cash Out';
      case 'merchant-payment': return 'Merchant Payment';
      case 'bill-payment': return 'Bill Payment';
      default: return 'Payment';
    }
  };

  const getPaymentTypeColor = () => {
    switch (paymentType) {
      case 'send-money': return 'from-blue-500 to-blue-600';
      case 'cash-out': return 'from-green-500 to-green-600';
      case 'merchant-payment': return 'from-purple-500 to-purple-600';
      case 'bill-payment': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (balanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getPaymentTypeColor()} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{getPaymentTypeLabel()}</h2>
              <p className="text-white/80 text-sm">Complete your payment</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">To:</span>
                <span className="font-medium text-right">
                  {recipientName || recipientId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{getPaymentTypeLabel()}</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium text-right text-sm">
                    {description}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Balance Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-blue-800 font-medium">Available Balance:</span>
              <span className="text-blue-900 font-bold text-lg">
                {formatCurrency(userBalance)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className={`w-full pl-10 pr-4 py-4 border rounded-lg focus:outline-none focus:ring-2 text-lg font-medium ${
                  checkSufficientBalance() || !amount 
                    ? 'border-gray-300 focus:ring-blue-500' 
                    : 'border-red-300 focus:ring-red-500 bg-red-50'
                }`}
                placeholder="0.00"
              />
            </div>
            {amount && (
              <div className="mt-2">
                {checkSufficientBalance() ? (
                  <p className="text-green-600 text-sm flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Amount: {formatCurrency(amount)}
                  </p>
                ) : (
                  <p className="text-red-600 text-sm flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Insufficient balance
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Payment Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          {amount && checkSufficientBalance() && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-green-800 mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Amount:</span>
                  <span className="font-medium text-green-900">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Remaining Balance:</span>
                  <span className="font-medium text-green-900">
                    {formatCurrency(userBalance - parseFloat(amount))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={loading || !checkSufficientBalance() || !amount}
              className={`w-full py-4 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                loading || !checkSufficientBalance() || !amount
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : `bg-gradient-to-r ${getPaymentTypeColor()} text-white hover:shadow-lg transform hover:scale-[1.02]`
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {amount && formatCurrency(amount)}
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel Payment
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs text-center">
              🔒 Your payment is secured with end-to-end encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentComponent;
