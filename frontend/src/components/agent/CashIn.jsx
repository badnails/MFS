// src/components/agent/CashIn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import AccountSearch from '../common/AccountSearch';

const CashIn = ({ onClose }) => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const verifyAccount = async (accountId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/transaction/verify-customer/${accountId}`);
      
      if (response.data.success) {
        const customer = response.data.account;
        setSelectedAccount(customer);
        setMessage({ type: 'success', text: 'Customer verified successfully' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Customer verification failed' 
      });
      setSelectedAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (account) => {
    if (account) {
      verifyAccount(account.accountid);
    } else {
      setSelectedAccount(null);
      setMessage({ type: '', text: '' });
    }
  };

  const handleContinue = () => {
    if (!selectedAccount) return;

    navigate('/payment', {
      state: {
        recipientId: selectedAccount.accountId,
        recipientName: selectedAccount.accountName,
        paymentType: 'cash-in',
        description: 'Cash In Transaction'
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Cash In</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Search */}
          <AccountSearch
            accountType="PERSONAL"
            onSelectAccount={handleAccountSelect}
            placeholder="Search for customer by name or account ID..."
            displayStyle="dropdown"
          />

          {/* Message Display */}
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

          {/* Customer Information Display */}
          {selectedAccount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Customer Verified</h4>
              <div className="text-sm text-green-700">
                <p><strong>Userame:</strong> {selectedAccount.accountName}</p>
                <p><strong>Account ID:</strong> {selectedAccount.accountId}</p>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Select the customer account, then proceed to enter the cash-in amount and complete the transaction.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedAccount || loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashIn;
