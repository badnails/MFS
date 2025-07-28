// src/components/agent/AddMoney.jsx
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AddMoney = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [supportDocument, setSupportDocument] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }
    
    setSupportDocument(file);
    setMessage({ type: '', text: '' });
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    
    if (!supportDocument) {
      setMessage({ type: 'error', text: 'Please upload a supporting document' });
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('supportDocument', supportDocument);
      
      await axios.post('/agent/add-money-request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage({ type: 'success', text: 'Money request submitted successfully!' });
      
      // Reset form
      setAmount('');
      setSupportDocument(null);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit money request' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(parseFloat(value));
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add Money Request</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            {amount && (
              <p className="mt-1 text-sm text-gray-600">
                Amount: {formatCurrency(amount)}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Document
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              {supportDocument ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{supportDocument.name}</p>
                  <p className="text-xs text-gray-500">
                    {(supportDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setSupportDocument(null)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Drop your image here, or{' '}
                      <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              )}
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
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Submit a request to add money to your agent float. 
              Include a supporting document (receipt, deposit slip, etc.) for verification.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || !supportDocument}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddMoney;
