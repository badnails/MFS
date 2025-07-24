// src/components/admin/BalanceUpdate.jsx
import React, { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import AccountSearch from '../common/AccountSearch';

const BalanceUpdate = () => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('PERSONAL');
  const [balanceChange, setBalanceChange] = useState('');
  const [operation, setOperation] = useState('add'); // 'add' or 'subtract'
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [accountBalance, setAccountBalance] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAccountBalance = async (accountId) => {
    setBalanceLoading(true);
    try {
      const response = await axios.get(`/user/balance/${accountId}`);
      setAccountBalance(response.data.availableBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setAccountBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setMessage({ type: '', text: '' });
    setAccountBalance(null);
    // Fetch balance for the selected account
    if (account && account.accountid) {
      fetchAccountBalance(account.accountid);
    }
  };

  const updateBalance = async () => {
    if (!selectedAccount || !balanceChange) return;

    setLoading(true);
    try {
      const amount = parseFloat(balanceChange);
      const finalAmount = operation === 'subtract' ? -amount : amount;
      
      await axios.post('/admin/balanceupdate', {
        accountId: selectedAccount.accountid,
        amount: finalAmount
      });

      setMessage({ 
        type: 'success', 
        text: `Balance ${operation === 'add' ? 'added' : 'subtracted'} successfully!` 
      });
      
      // Reset the form
      setBalanceChange('');
      
      // Refetch the updated balance
      if (selectedAccount && selectedAccount.accountid) {
        await fetchAccountBalance(selectedAccount.accountid);
      }
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

      {/* Account Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Account</h3>
        
        {/* Account Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type
          </label>
          <select
            value={selectedAccountType}
            onChange={(e) => {
              setSelectedAccountType(e.target.value);
              setSelectedAccount(null); // Reset selection when type changes
              setAccountBalance(null); // Reset balance when type changes
              setMessage({ type: '', text: '' }); // Clear messages
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PERSONAL">Personal Account</option>
            <option value="AGENT">Agent Account</option>
            <option value="REVENUE">Revenue Account</option>
          </select>
        </div>

        {/* Account Search Component */}
        <AccountSearch
          accountType={selectedAccountType}
          onSelectAccount={handleAccountSelect}
          placeholder={`Search for ${selectedAccountType.toLowerCase()} account...`}
          displayStyle="dropdown"
        />
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
                  <p className="text-gray-900">{selectedAccount.accountid}</p>
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
                  {balanceLoading ? (
                    <p className="text-gray-500 animate-pulse">Loading balance...</p>
                  ) : accountBalance !== null ? (
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(accountBalance)}
                    </p>
                  ) : (
                    <p className="text-gray-500">Balance unavailable</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-lg font-medium text-green-600">
                    {selectedAccount.accountstatus || 'ACTIVE'}
                  </p>
                </div>
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
                  onChange={(e) => setBalanceChange(Math.abs(parseFloat(e.target.value)))}
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