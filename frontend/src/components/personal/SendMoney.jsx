// src/components/personal/SendMoney.jsx - Update to use new backend endpoints
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, MessageSquare, User, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const SendMoney = ({ onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const searchAccounts = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get('/user/accountsearch', {
        params: { type: 'PERSONAL', query }
      });
      setSearchResults(response.data.accounts || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const verifyAccount = async (accountId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/transaction/verify-account/${accountId}`);
      
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
    setSelectedAccount(account);
    setSearchTerm(account.accountname);
    setSearchResults([]);
    verifyAccount(account.accountid);
  };

  const handleContinue = () => {
    if (!selectedAccount) return;

    navigate('/payment', {
      state: {
        recipientId: selectedAccount.accountId,
        recipientName: selectedAccount.accountName,
        paymentType: 'send-money',
        description: note
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Personal Account *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchAccounts(e.target.value);
                  if (!e.target.value) {
                    setSelectedAccount(null);
                    setMessage({ type: '', text: '' });
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name or account ID..."
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((account) => (
                  <button
                    key={account.accountid}
                    onClick={() => handleAccountSelect(account)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{account.accountname}</p>
                      <p className="text-sm text-gray-500">{account.accountid}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Account Display */}
          {selectedAccount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">{selectedAccount.accountName}</p>
                  <p className="text-sm text-blue-700">{selectedAccount.accountId}</p>
                </div>
              </div>
            </div>
          )}

          {/* Note Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                rows="3"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a note for this transaction"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

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
    </div>
  );
};

export default SendMoney;
