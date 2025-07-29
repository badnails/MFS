import React, { useState, useEffect } from 'react';
import { X, DollarSign, QrCode, Copy, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import QRCodeLib from 'qrcode';

const NewTransaction = ({ onClose }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState(1); // 1: Form, 2: Success with QR
  const [transactionData, setTransactionData] = useState(null);

  // Calculate fees when amount changes
  useEffect(() => {
    const fetchFee = async () => {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setFee(0);
        return;
      }
      
      setFeeLoading(true);
      try {
        const response = await axios.get(`/transaction/fees/PAYMENT/${amount}`);
        setFee(parseFloat(response.data.feeamount));
      } catch (err) {
        setFee(0);
        console.error('Fee calculation error:', err);
      } finally {
        setFeeLoading(false);
      }
    };
    
    fetchFee();
  }, [amount]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amtValue = parseFloat(amount);
    if (!amount || amtValue <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (amtValue < 0.01) {
      setMessage({ type: 'error', text: 'Minimum amount is $0.01' });
      return;
    }

    setLoading(true);
    try {
      // Create transaction using the initiate endpoint
      const response = await axios.post('/transaction/initiate', {
        recipientId: user.accountid, // Merchant is the recipient
        subamount: amtValue,
        type: 'PAYMENT',
        feeamount: fee
      });

      const transactionId = response.data.transactionid;
      
      // Create QR code data with metadata
      const webappQrData = transactionId; // Simple transaction ID only
      
      // Create gateway payment link
      const gatewayQrData = `https://tpg-six.vercel.app/gateway?transactionid=${transactionId}`;

      // Generate webapp QR code (transaction ID only)
      const webappQrCodeUrl = await QRCodeLib.toDataURL(webappQrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Generate gateway QR code (payment link)
      const gatewayQrCodeUrl = await QRCodeLib.toDataURL(gatewayQrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setTransactionData({
        transactionId,
        amount: amtValue,
        fee,
        total: amtValue + fee,
        webappQrData,
        gatewayQrData,
        webappQrUrl: webappQrCodeUrl,
        gatewayQrUrl: gatewayQrCodeUrl
      });
      
      setStep(2);
      setMessage({ type: 'success', text: 'Transaction created successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create transaction' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Copied to clipboard!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">New Transaction</h2>
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
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium"
                    placeholder="0.00"
                    required
                  />
                </div>
                {amount && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">
                      Amount: {formatCurrency(parseFloat(amount) || 0)}
                    </p>
                    <p className="text-gray-600">
                      Fee: {feeLoading ? 'Calculating...' : formatCurrency(fee)}
                    </p>
                    <p className="font-medium text-gray-900">
                      Total: {formatCurrency((parseFloat(amount) || 0) + fee)}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">How it works</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Create a transaction with the desired amount</li>
                  <li>• Share the transaction ID or QR code with the customer</li>
                  <li>• Customer scans the QR or enters the transaction ID</li>
                  <li>• Customer completes payment through their account</li>
                </ul>
              </div>

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

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !amount || feeLoading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Transaction'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 2 && transactionData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Created!</h3>
                <p className="text-gray-600">
                  Transaction for {formatCurrency(transactionData.amount)} has been created successfully.
                </p>
              </div>

              {/* Transaction ID Prominent Box */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                    <span className="font-mono text-lg font-medium text-gray-900 break-all">{transactionData.transactionId}</span>
                    <button
                      onClick={() => copyToClipboard(transactionData.transactionId)}
                      className="ml-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      title="Copy Transaction ID"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(transactionData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">{formatCurrency(transactionData.fee)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">{formatCurrency(transactionData.total)}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="space-y-6">
                {/* Webapp Payment QR */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    Webapp Payment
                  </h4>
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block mb-3">
                      {transactionData.webappQrUrl ? (
                        <img 
                          src={transactionData.webappQrUrl} 
                          alt="Webapp Payment QR Code" 
                          className="w-32 h-32 mx-auto"
                        />
                      ) : (
                        <QrCode className="h-32 w-32 text-gray-400 mx-auto" />
                      )}
                    </div>
                    <p className="text-sm text-blue-700 mb-3">Customer scans to pay via webapp</p>
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={() => copyToClipboard(transactionData.webappQrData)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy QR Data</span>
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.download = `webapp-qr-${transactionData.transactionId}.png`;
                          link.href = transactionData.webappQrUrl;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          setMessage({ type: 'success', text: 'Webapp QR downloaded!' });
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download QR</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gateway Payment QR */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    Gateway Payment
                  </h4>
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block mb-3">
                      {transactionData.gatewayQrUrl ? (
                        <img 
                          src={transactionData.gatewayQrUrl} 
                          alt="Gateway Payment QR Code" 
                          className="w-32 h-32 mx-auto"
                        />
                      ) : (
                        <QrCode className="h-32 w-32 text-gray-400 mx-auto" />
                      )}
                    </div>
                    <p className="text-sm text-purple-700 mb-3">Customer scans to pay via gateway</p>
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={() => copyToClipboard(transactionData.gatewayQrData)}
                        className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.download = `gateway-qr-${transactionData.transactionId}.png`;
                          link.href = transactionData.gatewayQrUrl;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          setMessage({ type: 'success', text: 'Gateway QR downloaded!' });
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {message.text && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewTransaction;
