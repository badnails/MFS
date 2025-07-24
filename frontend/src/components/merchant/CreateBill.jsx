// src/components/merchant/CreateBill.jsx
import React, { useState } from 'react';
import { X, Plus, User, DollarSign, FileText, Loader2, CheckCircle, AlertCircle, QrCode, Copy } from 'lucide-react';
import axios from 'axios';

const CreateBill = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerAccount: '',
    amount: '',
    description: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState(1); // 1: Form, 2: Success with QR
  const [billData, setBillData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerAccount || !formData.amount) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than 0' });
      return;
    }

    setLoading(true);
    try {
      // Create transaction using the external API
      const createResponse = await fetch('https://test-project-production-88cc.up.railway.app/api/create-trx', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'apikey': '13acc245-b584-4767-b80a-5c9a1fe9d71e' 
        },
        body: JSON.stringify({
          username : "scariful",
          amount: parseFloat(formData.amount)
        })
      });

      const createResult = await createResponse.json();
      console.log(createResult.transacitonId);   // for debugg
      if (createResult.valid) {
        const transactionId = createResult.transacitonId;
        
        // Store bill in our database
        // await axios.post('/merchant/create-bill', {
        //   customerAccount: formData.customerAccount,
        //   amount: parseFloat(formData.amount),
        //   description: formData.description,
        //   dueDate: formData.dueDate,
        //   externalTransactionId: transactionId
        // });

        // Generate payment gateway URL
        const gatewayUrl = `https://tpg-six.vercel.app/gateway?transactionid=${transactionId}&redirectURL=${encodeURIComponent(window.location.origin + '/payment-success')}`;
        
        setBillData({
          transactionId,
          gatewayUrl,
          amount: formData.amount,
          customerAccount: formData.customerAccount,
          description: formData.description
        });
        
        setStep(2);
        setMessage({ type: 'success', text: 'Bill created successfully!' });
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create bill' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create Payment Bill</h2>
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
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="customerAccount"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer account ID"
                    value={formData.customerAccount}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What is this payment for?"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.dueDate}
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
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Bill'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 2 && billData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Created Successfully!</h3>
                <p className="text-gray-600">
                  Payment bill for {formatCurrency(billData.amount)} has been created.
                </p>
              </div>

              {/* Bill Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{billData.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{billData.customerAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-lg">{formatCurrency(billData.amount)}</span>
                </div>
                {billData.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium">{billData.description}</span>
                  </div>
                )}
              </div>

              {/* Payment Gateway URL */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Payment Gateway URL</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={billData.gatewayUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-white border border-blue-300 rounded"
                  />
                  <button
                    onClick={() => copyToClipboard(billData.gatewayUrl)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-blue-700 text-xs mt-2">
                  Share this URL with your customer to complete the payment
                </p>
              </div>

              {/* QR Code for Payment */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                  <QrCode className="h-24 w-24 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">QR Code</p>
                  <p className="text-xs text-gray-500">Customer can scan to pay</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

export default CreateBill;
