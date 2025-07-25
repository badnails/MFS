// src/components/merchant/PendingBills.jsx
import React, { useState, useEffect } from 'react';
import { X, Receipt, RefreshCw, Eye, Copy, ExternalLink } from 'lucide-react';
import axios from 'axios';

const PendingBills = ({ onClose }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingBills();
  }, []);

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/merchant/pending-bills');
      setBills(response.data.bills || []);
    } catch (error) {
      console.error('Failed to fetch pending bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBillStatus = async (bill) => {
    try {
      setRefreshing(true);
      
      // Check status from external API
      const statusResponse = await fetch(`https://test-project-production-88cc.up.railway.app/api/get-trx-details/${bill.externalTransactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json', 
          'apikey': '13acc245-b584-4767-b80a-5c9a1fe9d71e'
        }
      });

      const statusResult = await statusResponse.json();
      
      if (statusResult.valid) {
        // Update bill status in our database
        await axios.put(`/merchant/update-bill-status/${bill.id}`, {
          status: statusResult.transactionDetails.status,
          completedOn: statusResult.transactionDetails.completed_on
        });
        
        // Refresh the list
        fetchPendingBills();
      }
    } catch (error) {
      console.error('Failed to refresh bill status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyPaymentUrl = (bill) => {
    const gatewayUrl = `https://tpg-six.vercel.app/gateway?transactionid=${bill.externalTransactionId}&redirectURL=${encodeURIComponent(window.location.origin + '/payment-success')}`;
    navigator.clipboard.writeText(gatewayUrl);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pending Bills</h2>
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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : bills.length > 0 ? (
            <div className="space-y-4">
              {bills.map((bill) => (
                <div key={bill.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                          PENDING
                        </span>
                        <span className="text-sm text-gray-500">
                          Bill #{bill.externalTransactionId.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <span className="ml-2 font-medium">{bill.customerAccount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="ml-2 font-medium">{formatCurrency(bill.amount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2">{formatDate(bill.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Due:</span>
                          <span className="ml-2">{bill.dueDate ? formatDate(bill.dueDate) : 'No due date'}</span>
                        </div>
                      </div>
                      {bill.description && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Description:</span>
                          <span className="ml-2">{bill.description}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => refreshBillStatus(bill)}
                        disabled={refreshing}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center space-x-1"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                      <button
                        onClick={() => copyPaymentUrl(bill)}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy URL</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending bills found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingBills;
