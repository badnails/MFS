// src/components/personal/BillPayment.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Receipt, Building } from 'lucide-react';
import AccountSearch from '../common/AccountSearch';

const BillPayment = ({ onClose }) => {
  const navigate = useNavigate();
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [billType, setBillType] = useState('electricity');

  const billTypes = [
    { value: 'electricity', label: 'Electricity' },
    { value: 'water', label: 'Water' },
    { value: 'gas', label: 'Gas' },
    { value: 'internet', label: 'Internet' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ];

  const handleBillerSelect = (biller) => {
    setSelectedBiller(biller);
  };

  const handleContinue = () => {
    if (!selectedBiller || !accountNumber) {
      return;
    }

    navigate('/payment', {
      state: {
        recipientId: selectedBiller.accountid,
        recipientName: selectedBiller.accountname,
        paymentType: 'bill-payment',
        description: `${billType.charAt(0).toUpperCase() + billType.slice(1)} bill - Account: ${accountNumber}`
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Bill Payment</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill Type *
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={billType}
              onChange={(e) => setBillType(e.target.value)}
            >
              {billTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <AccountSearch
            accountType="BILLER"
            onSelectAccount={handleBillerSelect}
            placeholder="Search for billers..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Account Number *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Your account number with the biller"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedBiller || !accountNumber}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPayment;
