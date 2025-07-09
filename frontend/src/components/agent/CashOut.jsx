// src/components/agent/CashOut.jsx
import React, { useState } from 'react';
import { X, Minus, User, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const CashOut = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerAccount: '',
    amount: '',
    customerPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const verifyCustomer = async () => {
    if (!formData.customerAccount) {
      setMessage({ type: 'error', text: 'Please enter customer account ID' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/agent/verify-customer/${formData.customerAccount}`);
      setCustomerInfo(response.data.customer);
      setMessage({ type: 'success', text: 'Customer verified successfully' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Customer not found' 
      });
      setCustomerInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerInfo) {
      setMessage({ type: 'error', text: 'Please verify customer first' });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (amount > customerInfo.availablebalance) {
      setMessage({ type: 'error', text: 'Insufficient balance in customer account' });
      return;
    }

    setStep(2);
  };

  const confirmTransaction = async () => {
    setLoading(true);
    try {
      await axios.post('/agent/cash-out', {
        customerAccount: formData.customerAccount,
        amount: parseFloat(formData.amount),
        customerPhone: formData.customerPhone
      });
      
      setStep(3);
      setMessage({ type: 'success', text: 'Cash out completed successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to process cash out' 
      });
      setStep(1);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Minus className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Cash Out</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Account ID *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="customerAccount"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter customer account ID"
                      value={formData.customerAccount}
                      onChange={handleChange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={verifyCustomer}
                    disabled={loading || !formData.customerAccount}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {customerInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Customer Verified</h4>
                  <div className="text-sm text-green-700">
                    <p><strong>Name:</strong> {customerInfo.accountname}</p>
                    <p><strong>Account:</strong> {customerInfo.accountid}</p>
                    <p><strong>Available Balance:</strong> {formatCurrency(customerInfo.availablebalance)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Debit *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    max={customerInfo?.availablebalance || 0}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>
                {customerInfo && formData.amount && parseFloat(formData.amount) > customerInfo.availablebalance && (
                  <p className="text-red-600 text-sm mt-1">
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Customer phone number"
                  value={formData.customerPhone}
                  onChange={handleChange}
                />
              </div>

              {message.text && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customerInfo || (formData.amount && parseFloat(formData.amount) > customerInfo?.availablebalance)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Cash Out</h3>
                <p className="text-gray-600">Please review the transaction details</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{customerInfo.accountname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">{formData.customerAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount to Debit:</span>
                  <span className="font-medium text-lg text-red-600">{formatCurrency(formData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Balance:</span>
                  <span className="font-medium">
                    {formatCurrency(customerInfo.availablebalance - parseFloat(formData.amount))}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Give cash to customer after confirming this transaction.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={confirmTransaction}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Cash Out'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash Out Successful!</h3>
                <p className="text-gray-600">
                  {formatCurrency(formData.amount)} has been debited from {customerInfo.accountname}'s account.
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  Please give cash to the customer.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashOut;
