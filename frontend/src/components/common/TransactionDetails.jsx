import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  X, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  Hash,
  Loader,
  Copy,
  Check,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  ChartNoAxesColumnDecreasingIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TransactionDetails = ({ transactionId, onClose, isOpen }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [revertData, setRevertData] = useState(null);
  const [revertLoading, setRevertLoading] = useState(false);
  const { user } = useAuth();

  const fetchTransactionDetails = useCallback(async () => {
    if (!transactionId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`/transaction/details/${transactionId}`);
      
      if (response.data.valid) {
        setTransaction(response.data.transactionDetails);
      } else {
        setError(response.data.message || 'Failed to fetch transaction details');
      }
    } catch (err) {
      setError('Failed to fetch transaction details');
      console.error('Transaction details fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchTransactionDetails();
    }
  }, [isOpen, transactionId, fetchTransactionDetails]);

  const getStatusDisplay = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bg: 'bg-green-100',
          border: 'border-green-200',
          label: 'Completed'
        };
      case 'PENDING':
        return { 
          icon: Clock, 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-100',
          border: 'border-yellow-200',
          label: 'Pending'
        };
      case 'FAILED':
        return { 
          icon: XCircle, 
          color: 'text-red-600', 
          bg: 'bg-red-100',
          border: 'border-red-200',
          label: 'Failed'
        };
      case 'REVERTED':
        return { 
          icon: RotateCcw, 
          color: 'text-purple-600', 
          bg: 'bg-purple-100',
          border: 'border-purple-200',
          label: 'Reverted'
        };
      case 'FAILED_TIMEOUT':
        return { 
          icon: AlertTriangle, 
          color: 'text-orange-600', 
          bg: 'bg-orange-100',
          border: 'border-orange-200',
          label: 'Timeout'
        };
      default:
        return { 
          icon: AlertTriangle, 
          color: 'text-gray-600', 
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          label: 'Unknown'
        };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCurrentUserSender = () => {
    return user && transaction && user.username === transaction.sender;
  };

  const isCurrentUserReceiver = () => {
    return user && transaction && user.username === transaction.recipient;
  };

  const getAmountColor = () => {
    if (isCurrentUserSender()) {
      return 'text-red-600'; // Sending money - red
    } else if (isCurrentUserReceiver()) {
      return 'text-green-600'; // Receiving money - green
    }
    return 'text-gray-600'; // Default
  };

  const getTransactionDirection = () => {
    if (isCurrentUserSender()) {
      return 'sent';
    } else if (isCurrentUserReceiver()) {
      return 'received';
    }
    return 'unknown';
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const formatTransactionType = (type) => {
    if (!type) return 'N/A';
    return type.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isAdmin = () => {
    return user && user.accounttype === 'ADMIN';
  };

  const canRevert = () => {
    return isAdmin() && transaction && transaction.status === 'COMPLETED';
  };

  const handleRevertClick = async () => {
    if (!transactionId) return;

    try {
      setRevertLoading(true);
      const response = await axios.post('/admin/check-revert', {
        transactionId: transactionId
      });

      if (response.data.valid) {
        setRevertData(response.data);
        setShowRevertModal(true);
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      console.error('Error checking revert eligibility:', err);
      alert('Failed to check revert eligibility');
    } finally {
      setRevertLoading(false);
    }
  };

  const handleRevertConfirm = async () => {
    if (!transactionId || !user) return;

    try {
      setRevertLoading(true);
      const response = await axios.post('/admin/execute-revert', {
        transactionId: transactionId,
        reverterAccountId: user.accountid,
        revertType: 'ADMIN_REVERT'
      });
      if (response.data.valid) {
        alert('Transaction reverted successfully');
        setShowRevertModal(false);
        onClose(); // Close the transaction details modal
        // Optionally trigger a refresh of the transaction history
        if (window.location.pathname.includes('admin')) {
          window.location.reload(); // Simple refresh for now
        }
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      console.log('Error executing revert:', err);
      alert('Failed to execute revert');
    } finally {
      setRevertLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
            <p className="text-sm text-gray-500">Transaction ID: {transactionId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading transaction details...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {transaction && !loading && !error && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                {(() => {
                  const statusDisplay = getStatusDisplay(transaction.status);
                  const StatusIcon = statusDisplay.icon;
                  return (
                    <div className={`inline-flex items-center px-4 py-2 rounded-full border ${statusDisplay.bg} ${statusDisplay.border}`}>
                      <StatusIcon className={`h-5 w-5 ${statusDisplay.color} mr-2`} />
                      <span className={`font-medium ${statusDisplay.color}`}>
                        {statusDisplay.label}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Main Transaction Flow */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  {/* Sender */}
                  <div className="flex-1 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                      isCurrentUserSender() ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'
                    }`}>
                      <User className={`h-6 w-6 ${
                        isCurrentUserSender() ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className={`space-y-1 p-2 rounded-lg ${
                      isCurrentUserSender() ? 'bg-blue-50 border border-blue-200' : ''
                    }`}>
                      <p className={`font-medium text-sm ${
                        isCurrentUserSender() ? 'text-blue-900 font-bold' : 'text-gray-900'
                      }`}>
                        {transaction.sender}
                      </p>
                      <p className={`text-xs ${
                        isCurrentUserSender() ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        Sender
                      </p>
                      {transaction.feesamount > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="block">Fee: {formatCurrency(transaction.feesamount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow and Amount */}
                  <div className="flex-1 flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-px bg-gray-300 w-8"></div>
                      <div className="bg-white rounded-full p-2 shadow-md border">
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="h-px bg-gray-300 w-8"></div>
                    </div>
                    
                    {/* Main Amount */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getAmountColor()}`}>
                        {formatCurrency(transaction.subamount)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getTransactionDirection() === 'sent' ? 'Amount Sent' : 
                         getTransactionDirection() === 'received' ? 'Amount Received' : 'Transaction Amount'}
                      </div>
                    </div>
                  </div>

                  {/* Receiver */}
                  <div className="flex-1 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                      isCurrentUserReceiver() ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-100'
                    }`}>
                      <User className={`h-6 w-6 ${
                        isCurrentUserReceiver() ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className={`space-y-1 p-2 rounded-lg ${
                      isCurrentUserReceiver() ? 'bg-green-50 border border-green-200' : ''
                    }`}>
                      <p className={`font-medium text-sm ${
                        isCurrentUserReceiver() ? 'text-green-900 font-bold' : 'text-gray-900'
                      }`}>
                        {transaction.recipient}
                      </p>
                      <p className={`text-xs ${
                        isCurrentUserReceiver() ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        Recipient
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Transaction Type */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 rounded-lg p-1.5">
                      <Hash className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Transaction Type</p>
                      <p className="font-medium text-sm text-gray-900 truncate">{formatTransactionType(transaction.type)}</p>
                    </div>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 rounded-lg p-1.5">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="font-medium text-sm text-gray-900">
                        {formatCurrency(parseFloat(transaction.subamount) + parseFloat(transaction.feesamount || 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completion Date */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-purple-100 rounded-lg p-1.5">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">
                        {transaction.status === 'COMPLETED' ? 'Completed On' : 'Status Date'}
                      </p>
                      <p className="font-medium text-sm text-gray-900">
                        {formatDate(transaction.completed_on)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transaction ID */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="bg-gray-100 rounded-lg p-1.5">
                        <Hash className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Transaction ID</p>
                        <p className="font-medium text-sm text-gray-900 truncate">{transaction.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(transaction.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Copy Transaction ID"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown (if applicable) */}
              {transaction.feesamount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h3 className="font-medium text-yellow-900 mb-2 text-sm">Fee Breakdown</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Subtotal:</span>
                      <span className="text-yellow-900 font-medium">{formatCurrency(transaction.subamount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Transaction Fee:</span>
                      <span className="text-yellow-900 font-medium">{formatCurrency(transaction.feesamount)}</span>
                    </div>
                    <hr className="border-yellow-300" />
                    <div className="flex justify-between font-medium">
                      <span className="text-yellow-900">Total:</span>
                      <span className="text-yellow-900">
                        {formatCurrency(parseFloat(transaction.subamount) + parseFloat(transaction.feesamount))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Revert Button (Admin Only) */}
        {canRevert() && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleRevertClick}
              disabled={revertLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {revertLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              <span>{revertLoading ? 'Processing...' : 'Revert Transaction'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Revert Confirmation Modal */}
      {showRevertModal && revertData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[160] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Transaction Revert</h3>
            </div>
            
            <div className="px-6 py-4">
              {revertData.canRevert ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to revert this transaction? This will transfer {formatCurrency(revertData.transaction.amount)} back to {revertData.transaction.sourceUsername}.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 mb-2">Balance Changes:</h4>
                      
                      {/* Source Account (Original Sender) */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{revertData.transaction.sourceUsername}:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{formatCurrency(revertData.transaction.sourceCurrentBalance)}</span>
                          <ArrowRight className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">{formatCurrency(revertData.transaction.sourceFutureBalance)}</span>
                        </div>
                      </div>
                      
                      {/* Destination Account (Original Receiver) */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{revertData.transaction.destinationUsername}:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{formatCurrency(revertData.transaction.destinationCurrentBalance)}</span>
                          <ArrowRight className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">{formatCurrency(revertData.transaction.destinationFutureBalance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Revert Not Possible</h4>
                      <p className="text-sm text-gray-600">{revertData.message}</p>
                    </div>
                  </div>
                  
                  {revertData.transaction && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-red-700">Required amount:</span>
                          <span className="font-medium text-red-900">{formatCurrency(revertData.transaction.amount)}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-red-700">Available balance:</span>
                          <span className="font-medium text-red-900">{formatCurrency(revertData.transaction.destinationBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-700">Shortfall:</span>
                          <span className="font-medium text-red-900">{formatCurrency(revertData.transaction.shortfall)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowRevertModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              {revertData.canRevert && (
                <button
                  onClick={handleRevertConfirm}
                  disabled={revertLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revertLoading ? 'Processing...' : 'Confirm Revert'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetails;
