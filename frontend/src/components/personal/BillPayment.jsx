import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Receipt, Building, Loader2, ChevronRight, Package, FileText, Calendar, Hash, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import AccountSearch from '../common/AccountSearch';
import axios from 'axios';

const BillPayment = ({ onClose }) => {
  const navigate = useNavigate();
  const [section, setSection] = useState(1); // Changed from step to section for multi-section support
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [billBatches, setBillBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [billFields, setBillFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingBills, setLoadingBills] = useState(false);
  const [error, setError] = useState('');

  // Handle biller selection and move to batch selection section
  const handleBillerSelect = async (biller) => {
    setSelectedBiller(biller);
    setLoadingBatches(true);
    setError('');
    try {
      const res = await axios.get(`/user/billbatches/${biller.accountid}`);
      setBillBatches(res.data);
      setSection(2);
    } catch (err) {
      console.log(err);
      setError('Failed to fetch bill batches for this biller.');
    } finally {
      setLoadingBatches(false);
    }
  };

  // Handle batch selection and move to next section
  const handleBatchSelect = async (batch) => {
    setSelectedBatch(batch);
    setLoadingFields(true);
    setError('');
    try {
      // Backend API call: GET /user/billfields/:batchid
      const res = await axios.get(`/user/billfields/${batch.batchid}`);
      setBillFields(res.data);
      
      // Initialize field values
      const initialValues = {};
      res.data.forEach(field => {
        initialValues[field.field_name] = '';
      });
      setFieldValues(initialValues);
      
      setSection(3);
    } catch (err) {
      console.log(err);
      setError('Failed to fetch bill fields for this batch.');
    } finally {
      setLoadingFields(false);
    }
  };

  // Navigation helper
  const goToSection = (sectionNumber) => {
    setSection(sectionNumber);
    setError('');
  };

  // Handle field value changes
  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Validate all required fields are filled
  const validateFields = () => {
    return billFields.every(field => {
      const value = fieldValues[field.field_name];
      return value && value.trim() !== '';
    });
  };

  // Get appropriate icon for field type
  const getFieldIcon = (fieldType) => {
    switch (fieldType.toLowerCase()) {
      case 'text':
        return <FileText className="h-5 w-5 text-gray-400" />;
      case 'number':
        return <Hash className="h-5 w-5 text-gray-400" />;
      case 'date':
        return <Calendar className="h-5 w-5 text-gray-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  // Render input field based on type
  const renderInputField = (field) => {
    const { field_name, field_type } = field;
    const value = fieldValues[field_name] || '';

    const baseInputClasses = "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    switch (field_type.toLowerCase()) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field_name, e.target.value)}
            className={baseInputClasses}
            placeholder={`Enter ${field_name.replace(/_/g, ' ')}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field_name, e.target.value)}
            className={baseInputClasses}
            placeholder={`Enter ${field_name.replace(/_/g, ' ')}`}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field_name, e.target.value)}
            className={baseInputClasses}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field_name, e.target.value)}
            className={baseInputClasses}
            placeholder={`Enter ${field_name.replace(/_/g, ' ')}`}
          />
        );
    }
  };

  // Search for bills based on field values
  const searchBills = async () => {
    setLoadingBills(true);
    setError('');
    try {
      // Backend API call: POST /user/searchbills
      const response = await axios.post('/user/searchbills', {
        batchid: selectedBatch.batchid,
        fieldValues: fieldValues
      });
      setBills(response.data);
      setSection(4);
    } catch (err) {
      console.log(err);
      setError('Failed to search bills. Please check your information and try again.');
    } finally {
      setLoadingBills(false);
    }
  };

  // Handle bill selection
  const handleBillSelect = (bill) => {
    setSelectedBill(bill);
  };

  // Check if bill is overdue
  const isBillOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Proceed to payment
  const proceedToPayment = () => {
    if (!selectedBill) {
      setError('Please select a bill to proceed.');
      return;
    }

    navigate('/payment', {
      state: {
        recipientId: selectedBiller.accountid,
        recipientName: selectedBiller.accountname,
        paymentType: 'bill-payment',
        description: `Bill ${selectedBill.billid}`,
        amount: selectedBill.amount,
        billId: selectedBill.billid
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out">
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

        {/* Section 1: Select Biller */}
        {section === 1 && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-orange-600">1</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Select Biller</h3>
            </div>
            <p className="text-sm text-gray-600">Search and select a biller to view available bill batches</p>
            <AccountSearch
              accountType="BILLER"
              onSelectAccount={handleBillerSelect}
              placeholder="Search for billers..."
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {loadingBatches && (
              <div className="flex items-center justify-center pt-4">
                <Loader2 className="animate-spin h-5 w-5 text-orange-600" />
                <span className="ml-2 text-sm text-gray-600">Loading bill batches...</span>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Select Bill Batch */}
        {section === 2 && (
          <div className="p-6 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-orange-600">2</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Select Bill Batch</h3>
            </div>
            
            {/* Biller Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedBiller?.accountname}</p>
                  <p className="text-xs text-gray-500">Biller ID: {selectedBiller?.accountid}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Select a bill batch from <span className="font-semibold">{selectedBiller?.accountname}</span>
            </p>

            {billBatches.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No bill batches available for this biller.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {billBatches.map((batch) => (
                  <div
                    key={batch.batchid}
                    onClick={() => handleBatchSelect(batch)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 group-hover:text-orange-800">
                            {batch.batchname}
                          </p>
                          <p className="text-xs text-gray-500">Batch ID: {batch.batchid}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => goToSection(1)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Billers
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Fill Bill Details */}
        {section === 3 && (
          <div className="p-6 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-orange-600">3</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Fill Bill Details</h3>
            </div>
            
            {/* Breadcrumb Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Biller:</span>
                <span className="font-medium">{selectedBiller?.accountname}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Batch:</span>
                <span className="font-medium">{selectedBatch?.batchname}</span>
              </div>
            </div>

            {loadingFields ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin h-5 w-5 text-orange-600" />
                <span className="ml-2 text-sm text-gray-600">Loading bill fields...</span>
              </div>
            ) : billFields.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No fields configured for this batch.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Please fill in the required information to proceed with the bill payment.
                </p>
                
                {billFields.map((field) => (
                  <div key={field.field_name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {getFieldIcon(field.field_type)}
                      </div>
                      {renderInputField(field)}
                    </div>
                    <p className="text-xs text-gray-500">
                      Field type: {field.field_type.toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => goToSection(2)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Batches
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              {billFields.length > 0 && (
                <button
                  onClick={() => {
                    if (validateFields()) {
                      searchBills();
                    } else {
                      setError('Please fill in all required fields.');
                    }
                  }}
                  disabled={!validateFields() || loadingBills}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                    validateFields() && !loadingBills
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loadingBills ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Searching...
                    </>
                  ) : (
                    'Search Bills'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Select Bill */}
        {section === 4 && (
          <div className="p-6 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-orange-600">4</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Select Bill</h3>
            </div>
            
            {/* Breadcrumb Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Biller:</span>
                <span className="font-medium">{selectedBiller?.accountname}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Batch:</span>
                <span className="font-medium">{selectedBatch?.batchname}</span>
              </div>
            </div>

            {bills.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No bills found matching your criteria.</p>
                <p className="text-gray-400 text-xs mt-2">Please go back and check your information.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Found {bills.length} bill{bills.length !== 1 ? 's' : ''} matching your criteria. Select one to proceed with payment.
                </p>
                
                <div className="space-y-3">
                  {bills.map((bill) => (
                    <div
                      key={bill.billid}
                      onClick={() => handleBillSelect(bill)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedBill?.billid === bill.billid
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedBill?.billid === bill.billid 
                                ? 'bg-orange-200' 
                                : 'bg-gray-100'
                            }`}>
                              <Receipt className={`h-5 w-5 ${
                                selectedBill?.billid === bill.billid 
                                  ? 'text-orange-700' 
                                  : 'text-gray-500'
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                Bill #{bill.billid.substring(0, 8)}...
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(bill.amount)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 ml-13">
                            <div>
                              <span className="text-gray-500">Issue Date:</span>
                              <p className="font-medium">{new Date(bill.issuedate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Due Date:</span>
                              <div className="flex items-center space-x-1">
                                <p className={`font-medium ${isBillOverdue(bill.duedate) ? 'text-red-600' : 'text-gray-900'}`}>
                                  {new Date(bill.duedate).toLocaleDateString()}
                                </p>
                                {isBillOverdue(bill.duedate) ? (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                ) : new Date(bill.duedate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? (
                                  <Clock className="h-3 w-3 text-yellow-500" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div className="mt-3 ml-13">
                            {isBillOverdue(bill.duedate) ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </span>
                            ) : new Date(bill.duedate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                <Clock className="h-3 w-3 mr-1" />
                                Due Soon
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {selectedBill?.billid === bill.billid && (
                          <div className="ml-4">
                            <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => goToSection(3)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Fields
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              {selectedBill && (
                <button
                  onClick={proceedToPayment}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Proceed to Payment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default BillPayment;
