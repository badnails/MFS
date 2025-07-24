import React, { useState } from 'react';
import TransactionDetails from './common/TransactionDetails';

const TestTransactionDetailsButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handleOpenModal = () => {
    if (!transactionId.trim()) {
      alert('Please enter a transaction ID');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Test Transaction Details Modal</h3>
      <div className="space-y-3">
        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">
            Transaction ID
          </label>
          <input
            type="text"
            id="transactionId"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter transaction ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Transaction Details
        </button>
      </div>

      <TransactionDetails
        transactionId={transactionId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TestTransactionDetailsButton;
