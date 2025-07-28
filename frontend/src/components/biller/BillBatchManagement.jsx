import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Clock, Calendar, DollarSign, FileText, Edit2, Check, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BillBatchManagement = () => {
  const [billBatches, setBillBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [showChanges, setShowChanges] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const recurrenceTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  useEffect(() => {
    fetchBillBatches();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBatches(billBatches);
    } else {
      setFilteredBatches(
        billBatches.filter(batch =>
          batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.id.toString().includes(searchTerm)
        )
      );
    }
  }, [searchTerm, billBatches]);

  const fetchBillBatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/biller/bill-batches');
      setBillBatches(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load bill batches');
      console.error('Error fetching bill batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setEditForm({
      recurrenceType: batch.recurrenceType,
      penaltyRate: batch.penaltyRate,
      minimumPenalty: batch.minimumPenalty,
      maximumPenalty: batch.maximumPenalty,
      // defaultDuration: batch.defaultDuration // TODO: Fix interval parsing
    });
    setPendingChanges({});
    setShowChanges(false);
    setIsEditing(false);
  };

  const handleEditChange = (field, value) => {
    const oldValue = selectedBatch[field];
    const newValue = value;
    
    setEditForm(prev => ({ ...prev, [field]: newValue }));
    
    if (oldValue !== newValue) {
      setPendingChanges(prev => ({
        ...prev,
        [field]: { old: oldValue, new: newValue }
      }));
      setShowChanges(true);
    } else {
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
      setShowChanges(Object.keys(pendingChanges).length > 1);
    }
  };

  const handleSubmitChanges = async () => {
    try {
      setUpdateLoading(true);
      await axios.put(`/biller/bill-batches/${selectedBatch.id}`, editForm);
      
      // Update local state
      const updatedBatch = { ...selectedBatch, ...editForm };
      setSelectedBatch(updatedBatch);
      setBillBatches(prev => 
        prev.map(batch => batch.id === selectedBatch.id ? updatedBatch : batch)
      );
      
      setPendingChanges({});
      setShowChanges(false);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to update bill batch');
      console.error('Error updating bill batch:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatCountdown = (timestamp) => {
    const now = new Date().getTime();
    const target = new Date(timestamp).getTime();
    const diff = target - now;

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bill batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Bill Batch Management</h1>
        <p className="text-blue-100">Manage your recurring bill batches and settings</p>
      </div>

      {/* Batch Selection */}
      {!selectedBatch && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Bill Batch</h2>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by batch name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => handleBatchSelect(batch)}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-blue-300"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{batch.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">ID: ***{batch.id.toString().slice(-4)}</p>
                  <p className="text-sm text-gray-600">
                    {batch.totalBills} bills • {batch.recurrenceType}
                  </p>
                </div>
              ))}
            </div>

            {filteredBatches.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bill batches found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Batch Management */}
      {selectedBatch && (
        <div className="space-y-6">
          {/* Selected Batch Header */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedBatch.name}</h2>
                <p className="text-gray-600">ID: ***{selectedBatch.id.toString().slice(-4)}</p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Change Batch
              </button>
            </div>
          </div>

          {/* Batch Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Batch Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">{new Date(selectedBatch.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Recurrence</p>
                  <p className="font-medium">{new Date(selectedBatch.lastRecurrenceDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Recurrence In</p>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-orange-500 mr-1" />
                    <p className="font-bold text-orange-600">{formatCountdown(selectedBatch.nextRecurrenceDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bills Statistics Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Bill Statistics</h3>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{selectedBatch.totalBills}</p>
                  <p className="text-sm text-gray-600">Total Bills</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{selectedBatch.paidBills}</p>
                    <p className="text-xs text-gray-600">Paid</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-orange-600">{selectedBatch.unpaidBills}</p>
                    <p className="text-xs text-gray-600">Unpaid</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Penalty Information Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Penalty Info</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Rate</p>
                  <p className="font-medium">{selectedBatch.penaltyRate}%</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-600">Min</p>
                    <p className="font-medium text-sm">{formatCurrency(selectedBatch.minimumPenalty)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Max</p>
                    <p className="font-medium text-sm">{formatCurrency(selectedBatch.maximumPenalty)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Settings */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Batch Settings</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isEditing 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Cancel' : 'Edit Settings'}
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recurrence Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recurrence Type
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={editForm.recurrenceType}
                        onChange={(e) => handleEditChange('recurrenceType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        {recurrenceTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg font-medium capitalize">
                      {selectedBatch.recurrenceType}
                    </p>
                  )}
                </div>

                {/* Penalty Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penalty Rate (%)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.penaltyRate}
                      onChange={(e) => handleEditChange('penaltyRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg font-medium">
                      {selectedBatch.penaltyRate}%
                    </p>
                  )}
                </div>

                {/* Default Duration */}
                {/* TODO: Fix interval parsing for default duration
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Duration (days)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.defaultDuration}
                      onChange={(e) => handleEditChange('defaultDuration', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg font-medium">
                      {selectedBatch.defaultDuration} days
                    </p>
                  )}
                </div>
                */}

                {/* Minimum Penalty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Penalty
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.minimumPenalty}
                      onChange={(e) => handleEditChange('minimumPenalty', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg font-medium">
                      {formatCurrency(selectedBatch.minimumPenalty)}
                    </p>
                  )}
                </div>

                {/* Maximum Penalty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Penalty
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.maximumPenalty}
                      onChange={(e) => handleEditChange('maximumPenalty', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg font-medium">
                      {formatCurrency(selectedBatch.maximumPenalty)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Changes Preview */}
          {showChanges && Object.keys(pendingChanges).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-amber-800 mb-4">Pending Changes</h4>
              <div className="space-y-3">
                {Object.entries(pendingChanges).map(([field, change]) => (
                  <div key={field} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-red-600 line-through">{change.old}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 font-medium">{change.new}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditForm({
                      recurrenceType: selectedBatch.recurrenceType,
                      penaltyRate: selectedBatch.penaltyRate,
                      minimumPenalty: selectedBatch.minimumPenalty,
                      maximumPenalty: selectedBatch.maximumPenalty,
                      // defaultDuration: selectedBatch.defaultDuration // TODO: Fix interval parsing
                    });
                    setPendingChanges({});
                    setShowChanges(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reset Changes
                </button>
                <button
                  onClick={handleSubmitChanges}
                  disabled={updateLoading}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Submit Changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillBatchManagement;
