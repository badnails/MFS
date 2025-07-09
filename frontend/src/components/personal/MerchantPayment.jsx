// src/components/personal/MerchantPayment.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Store, QrCode } from 'lucide-react';
import AccountSearch from '../common/AccountSearch';

const MerchantPayment = ({ onClose }) => {
  const navigate = useNavigate();
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [description, setDescription] = useState('');

  const handleMerchantSelect = (merchant) => {
    setSelectedMerchant(merchant);
  };

  const handleContinue = () => {
    if (!selectedMerchant) {
      return;
    }

    navigate('/payment', {
      state: {
        recipientId: selectedMerchant.accountid,
        recipientName: selectedMerchant.accountname,
        paymentType: 'merchant-payment',
        description: description || 'Merchant payment'
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Store className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Merchant Payment</h2>
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
          <AccountSearch
            accountType="MERCHANT"
            onSelectAccount={handleMerchantSelect}
            placeholder="Search for merchants..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="What are you paying for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Scan QR Code</p>
              <p className="text-xs text-gray-500">Or search manually above</p>
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
              disabled={!selectedMerchant}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPayment;
