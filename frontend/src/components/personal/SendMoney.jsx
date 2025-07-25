// src/components/personal/SendMoney.jsx - Update to use new backend endpoints
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import AccountSearch from '../common/AccountSearch';

const SendMoney = ({ onClose }) => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const verifyAccount = async (accountId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/transaction/verify-customer/${accountId}`);
      
      if (response.data.success) {
        setSelectedAccount(response.data.account);
        setMessage({ type: 'success', text: 'Account verified successfully' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Account verification failed' 
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
        paymentType: 'send-money'
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Send Money</h2>
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
            placeholder="Search by name or account ID..."
            displayStyle="circles"
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
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SendMoney;