// src/components/admin/BalanceUpdate.jsx
import React, { useState } from 'react';
import { Search, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BalanceUpdate = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balanceChange, setBalanceChange] = useState('');
  const [operation, setOperation] = useState('add'); // 'add' or 'subtract'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const searchAccount = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/user/validate-account/${searchTerm}`);
      setSelectedAccount(response.data);
      //console.log(selectedAccount.accountId);
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Account not found' 
      });
      setSelectedAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async () => {
    if (!selectedAccount || !balanceChange) return;

    setLoading(true);
    try {
      const amount = parseFloat(balanceChange);
      const finalAmount = operation === 'subtract' ? -amount : amount;
      
      await axios.post('/admin/balanceupdate', {
        accountId: selectedAccount.accountId,
        amount: finalAmount
      });

      setMessage({ 
        type: 'success', 
        text: `Balance ${operation === 'add' ? 'added' : 'subtracted'} successfully!` 
      });
      
      // Refresh account data
      searchAccount();
      setBalanceChange('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update balance' 
      });
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Balance Update</h2>
        <p className="text-gray-600">Search for an account and update their balance.</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Account</h3>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter Account ID or Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAccount()}
            />
          </div>
          <button
            onClick={searchAccount}
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Account Details */}
      {selectedAccount && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Account ID</label>
                  <p className="text-gray-900">{selectedAccount.accountId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{selectedAccount.accountname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-gray-900">{selectedAccount.accounttype}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Available Balance</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedAccount.availablebalance)}
                  </p>
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-gray-600">Available Balance</label>
                  <p className="text-lg text-gray-900">
                    {formatCurrency(selectedAccount.availablebalance)}
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Update Form */}
      {selectedAccount && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Balance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="add">Add to Balance</option>
                  <option value="subtract">Subtract from Balance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={balanceChange}
                  onChange={(e) => setBalanceChange(e.target.value)}
                />
              </div>
            </div>
            
            <button
              onClick={updateBalance}
              disabled={loading || !balanceChange}
              className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>{loading ? 'Updating...' : 'Update Balance'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
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
    </div>
  );
};

export default BalanceUpdate;