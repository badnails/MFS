import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, DollarSign, Edit2, Trash2, Check, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const BillManagement = () => {
  // State for batch selection
  const [billBatches, setBillBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for bills management
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [billsLoading, setBillsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [filters, setFilters] = useState({
    overdue: '',
    paid: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' }
  });

  // Edit modal state
  const [editingBill, setEditingBill] = useState(null);
  const [billFields, setBillFields] = useState([]);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Delete confirmation state
  const [deletingBill, setDeletingBill] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch bill batches on component mount
  useEffect(() => {
    fetchBillBatches();
  }, []);

  // Search batches when search term changes
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

  // Filter and search bills
  useEffect(() => {
    applyBillFilters();
  }, [bills, billSearchTerm, filters, currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchBillsForBatch = async (batchId) => {
    try {
      setBillsLoading(true);
      const response = await axios.get(`/biller/bills/${batchId}`);
      
      setBills(response.data);
      setCurrentPage(1);
      setError('');
    } catch (err) {
      setError('Failed to load bills for this batch');
      console.error('Error fetching bills:', err);
    } finally {
      setBillsLoading(false);
    }
  };

  const fetchBillFields = async (batchId) => {
    try {
      const response = await axios.get(`/biller/bill-fields/${batchId}`);
      setBillFields(response.data);
    } catch (err) {
      console.error('Error fetching bill fields:', err);
    }
  };

  const handleBatchSelect = async (batch) => {
    setSelectedBatch(batch);
    await Promise.all([
      fetchBillsForBatch(batch.id),
      fetchBillFields(batch.id)
    ]);
  };

  const applyBillFilters = () => {
    let filtered = [...bills];

    // Apply search filter
    if (billSearchTerm.trim()) {
      const searchLower = billSearchTerm.toLowerCase();
      filtered = filtered.filter(bill => 
        bill.billid.toLowerCase().includes(searchLower) ||
        bill.amount.toString().includes(searchLower)
      );
    }

    // Apply overdue filter
    if (filters.overdue !== '') {
      const now = new Date();
      if (filters.overdue === 'true') {
        filtered = filtered.filter(bill => new Date(bill.duedate) < now && !bill.ispaid);
      } else {
        filtered = filtered.filter(bill => new Date(bill.duedate) >= now);
      }
    }

    // Apply paid status filter
    if (filters.paid !== '') {
      if (filters.paid === 'true') {
        filtered = filtered.filter(bill => bill.ispaid);
      } else {
        filtered = filtered.filter(bill => !bill.ispaid);
      }
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(bill => 
        new Date(bill.issuedate) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(bill => 
        new Date(bill.issuedate) <= new Date(filters.dateRange.end)
      );
    }

    // Apply amount range filter
    if (filters.amountRange.min) {
      filtered = filtered.filter(bill => 
        parseFloat(bill.amount) >= parseFloat(filters.amountRange.min)
      );
    }
    if (filters.amountRange.max) {
      filtered = filtered.filter(bill => 
        parseFloat(bill.amount) <= parseFloat(filters.amountRange.max)
      );
    }

    // Calculate pagination
    const totalFiltered = filtered.length;
    setTotalPages(Math.ceil(totalFiltered / pageSize));
    
    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBills = filtered.slice(startIndex, endIndex);

    setFilteredBills(paginatedBills);
  };

  const fetchBillFieldValues = async (billId) => {
    try {
      const response = await axios.get(`/biller/bill-field-values/${billId}`);
      return response.data;
    } catch (err) {
      console.error('Error fetching bill field values:', err);
      return [];
    }
  };

  const handleEditBill = async (bill) => {
    try {
      setEditLoading(true);
      setEditingBill(bill);
      
      // Initialize form data with current bill basic data
      const formData = { 
        amount: bill.amount, 
        issuedate: bill.issuedate, 
        duedate: bill.duedate 
      };
      
      // Fetch field values for this specific bill
      const fieldValues = await fetchBillFieldValues(bill.billid);
      
      // Add field values to form data
      fieldValues.forEach(field => {
        formData[field.field_name] = field.field_value;
      });
      
      setEditFormData(formData);
    } catch (err) {
      setError('Failed to load bill details for editing');
      console.error('Error in handleEditBill:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveBill = async () => {
    try {
      setSaveLoading(true);
      
      // Prepare the update data
      const updateData = {
        batchid: selectedBatch.id,
        billid: editingBill.billid,
        amount: editFormData.amount,
        issuedate: editFormData.issuedate,
        duedate: editFormData.duedate,
        fieldValues: billFields.map(field => ({
          field_name: field.field_name,
          field_value: editFormData[field.field_name] || ''
        }))
      };

      await axios.put(`/biller/bills/${editingBill.billid}`, updateData);
      
      // Refresh bills list
      await fetchBillsForBatch(selectedBatch.id);
      setEditingBill(null);
      setError('');
    } catch (err) {
      setError('Failed to update bill');
      console.error('Error updating bill:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteBill = async (bill) => {
    setDeletingBill(bill);
  };

  const confirmDeleteBill = async () => {
    try {
      setDeleteLoading(true);
      await axios.delete(`/biller/bills/${deletingBill.billid}`);
      
      // Refresh bills list
      await fetchBillsForBatch(selectedBatch.id);
      setDeletingBill(null);
      setError('');
    } catch (err) {
      setError('Failed to delete bill');
      console.error('Error deleting bill:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `৳${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const isOverdue = (dueDate, ispaid) => {
    return new Date(dueDate) < new Date() && !ispaid;
  };

  const getLastSixChars = (str) => {
    return str.slice(-6);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading bill batches...</p>
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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Bill Management</h1>
        <p className="text-green-100">Manage and edit individual bills within your batches</p>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => handleBatchSelect(batch)}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-green-300"
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

      {/* Bill Management Interface */}
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

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bills..."
                  value={billSearchTerm}
                  onChange={(e) => setBillSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Overdue Filter */}
              <select
                value={filters.overdue}
                onChange={(e) => setFilters({...filters, overdue: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Bills</option>
                <option value="true">Overdue Only</option>
                <option value="false">Not Overdue</option>
              </select>

              {/* Paid Status Filter */}
              <select
                value={filters.paid}
                onChange={(e) => setFilters({...filters, paid: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Paid</option>
                <option value="false">Unpaid</option>
              </select>

              {/* Page Size */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Issue Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: {...filters.dateRange, start: e.target.value}
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: {...filters.dateRange, end: e.target.value}
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Amount Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min amount"
                    value={filters.amountRange.min}
                    onChange={(e) => setFilters({
                      ...filters,
                      amountRange: {...filters.amountRange, min: e.target.value}
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Max amount"
                    value={filters.amountRange.max}
                    onChange={(e) => setFilters({
                      ...filters,
                      amountRange: {...filters.amountRange, max: e.target.value}
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {billsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading bills...</span>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bill ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBills.map((bill) => (
                        <tr key={bill.billid} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ***{getLastSixChars(bill.billid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(bill.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(bill.issuedate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(bill.duedate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isOverdue(bill.duedate, bill.ispaid) 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {isOverdue(bill.duedate, bill.ispaid) ? 'Overdue' : 'On Time'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                bill.ispaid
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {bill.ispaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditBill(bill)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Edit bill"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBill(bill)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete bill"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {filteredBills.length === 0 && !billsLoading && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No bills found matching your criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Bill ***{getLastSixChars(editingBill.billid)}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {editLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Loading bill details...</span>
                </div>
              ) : (
                <>
                  {/* Basic Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.amount || ''}
                        onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                      <input
                        type="date"
                        value={editFormData.issuedate || ''}
                        onChange={(e) => setEditFormData({...editFormData, issuedate: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        value={editFormData.duedate || ''}
                        onChange={(e) => setEditFormData({...editFormData, duedate: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  {billFields.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Custom Fields</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {billFields.map((field) => (
                          <div key={field.field_name}>
                            <label className="block text-sm font-medium text-gray-700">
                              {field.field_name.replace(/_/g, ' ')}
                            </label>
                            <input
                              type={field.field_type === 'NUMBER' ? 'number' : field.field_type === 'DATE' ? 'date' : 'text'}
                              value={editFormData[field.field_name] || ''}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                [field.field_name]: e.target.value
                              })}
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditingBill(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBill}
                disabled={editLoading || saveLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600">
                Are you sure you want to delete bill ***{getLastSixChars(deletingBill.billid)}? 
                This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeletingBill(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBill}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;
