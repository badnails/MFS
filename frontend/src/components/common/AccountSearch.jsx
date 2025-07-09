// src/components/common/AccountSearch.jsx
import React, { useState, useEffect } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import axios from 'axios';

const AccountSearch = ({ accountType, onSelectAccount, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchAccounts();
    } else {
      setFilteredAccounts([]);
    }
  }, [searchTerm]);

  const searchAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/user/accountsearch', {
        params: {
          type: accountType,
          query: searchTerm
        }
      });
      
      const results = response.data.accounts || [];
      setAccounts(results);
      setFilteredAccounts(results);
    } catch (error) {
      console.error('Search failed:', error);
      setFilteredAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setSearchTerm(account.accountname || account.accountid);
    setFilteredAccounts([]);
    onSelectAccount(account);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (selectedAccount && value !== selectedAccount.accountname && value !== selectedAccount.accountid) {
      setSelectedAccount(null);
      onSelectAccount(null);
    }
  };

  const getAccountTypeLabel = () => {
    switch (accountType) {
      case 'PERSONAL': return 'Personal Account';
      case 'AGENT': return 'Agent';
      case 'MERCHANT': return 'Merchant';
      case 'BILLER': return 'Biller';
      default: return 'Account';
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Search {getAccountTypeLabel()} *
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder || `Search for ${getAccountTypeLabel().toLowerCase()}...`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {filteredAccounts.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredAccounts.map((account) => (
            <button
              key={account.accountid}
              onClick={() => handleSelectAccount(account)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{account.accountname}</p>
                <p className="text-sm text-gray-500">{account.accountid}</p>
                {account.location && (
                  <p className="text-xs text-gray-400">{account.location}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Selected Account Display */}
      {selectedAccount && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">{selectedAccount.accountname}</p>
              <p className="text-sm text-blue-700">{selectedAccount.accountid}</p>
            </div>
          </div>
        </div>
      )}
      
      {searchTerm.length > 0 && searchTerm.length < 3 && (
        <p className="text-sm text-gray-500 mt-1">
          Type at least 3 characters to search
        </p>
      )}
    </div>
  );
};

export default AccountSearch;
