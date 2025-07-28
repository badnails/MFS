import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Plus, Search, ArrowLeft, Trash2 } from 'lucide-react';

const AssignBill = ({ onClose }) => {
    const [currentSection, setCurrentSection] = useState(1);
    const [batches, setBatches] = useState([]);
    const [filteredBatches, setFilteredBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [billFields, setBillFields] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [billsToAdd, setBillsToAdd] = useState([]);
    const [currentBillForm, setCurrentBillForm] = useState({
        amount: '',
        issuedate: '',
        fields: {}
    });
    const [error, setError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessingCsv, setIsProcessingCsv] = useState(false);
    const [commitResult, setCommitResult] = useState(null);
    const [showFailedEntries, setShowFailedEntries] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, []);

    useEffect(() => {
    const filtered = batches.filter(batch =>
        (typeof batch?.name === 'string' &&
            batch.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (batch?.id &&
            batch.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredBatches(filtered);
}, [searchTerm, batches]);

    const fetchBatches = async () => {
        try {
            const response = await axios.get('/biller/bill-batches');
            setBatches(response.data.batches || response.data);
            setFilteredBatches(response.data.batches || response.data);
        } catch {
            setError('Failed to load batches');
        }
    };

    const fetchBillFields = async (batchid) => {
        try {
            const response = await axios.get(`/biller/bill-fields/${batchid}`);
            setBillFields(response.data);
        } catch {
            setError('Failed to load bill fields');
        }
    };

    const handleBatchSelect = (batch) => {
        setSelectedBatch(batch);
        fetchBillFields(batch.id);
        setCurrentSection(2);
    };

    const handleAddNewBill = () => {
        setCurrentBillForm({
            amount: '',
            issuedate: '',
            fields: {}
        });
        setCurrentSection(3);
    };

    const handleBasicInfoNext = () => {
        // Validate amount and date first
        if (!currentBillForm.amount || !currentBillForm.issuedate) {
            setError('Amount and issue date are required');
            return;
        }

        // Check if the date is in the future
        const selectedDate = new Date(currentBillForm.issuedate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        
        if (selectedDate <= today) {
            setError('Start date must be in the future');
            return;
        }

        setError('');
        setCurrentSection(4);
    };

    const handleBillFormChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'amount' || name === 'issuedate') {
            setCurrentBillForm(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            // Handle field inputs
            setCurrentBillForm(prev => ({
                ...prev,
                fields: {
                    ...prev.fields,
                    [name]: value
                }
            }));
        }
    };

    const handleAddBill = () => {
        // Validate all bill fields are filled
        const missingFields = billFields.filter(field => 
            !currentBillForm.fields[field.field_name] || 
            currentBillForm.fields[field.field_name].trim() === ''
        );
        
        if (missingFields.length > 0) {
            setError(`Please fill all required fields: ${missingFields.map(f => f.field_name).join(', ')}`);
            return;
        }

        // Create bill object
        const newBill = {
            amount: currentBillForm.amount,
            issuedate: currentBillForm.issuedate,
            fields: billFields.map(field => ({
                field_name: field.field_name,
                field_value: currentBillForm.fields[field.field_name]
            }))
        };

        setBillsToAdd(prev => [...prev, newBill]);
        setCurrentSection(2);
        setError('');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatFieldName = (fieldName) => {
        return fieldName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const getRequiredCsvHeaders = () => {
        const baseHeaders = ['amount', 'issuedate'];
        const fieldHeaders = billFields.map(field => field.field_name);
        return [...baseHeaders, ...fieldHeaders];
    };

    const parseCsvContent = (csvContent) => {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header row and one data row');
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = getRequiredCsvHeaders();
        
        // Validate headers
        const missingHeaders = requiredHeaders.filter(required => 
            !headers.includes(required.toLowerCase())
        );
        
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        // Parse data rows
        const bills = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Skip empty lines
            
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) {
                throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
            }

            const bill = {
                amount: '',
                issuedate: '',
                fields: []
            };

            // Map values to bill structure
            headers.forEach((header, index) => {
                const value = values[index];
                
                if (header === 'amount') {
                    const amount = parseFloat(value);
                    if (isNaN(amount) || amount <= 0) {
                        throw new Error(`Invalid amount "${value}" in row ${i + 1}`);
                    }
                    bill.amount = amount.toString();
                } else if (header === 'issuedate') {
                    // Validate date format (accepts yyyy-mm-dd or dd/mm/yyyy)
                    let dateStr = value;
                    if (value.includes('/')) {
                        // Convert dd/mm/yyyy to yyyy-mm-dd
                        const parts = value.split('/');
                        if (parts.length === 3) {
                            dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                    }
                    
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) {
                        throw new Error(`Invalid date "${value}" in row ${i + 1}. Use yyyy-mm-dd or dd/mm/yyyy format`);
                    }
                    
                    // Check if date is in the future
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date <= today) {
                        throw new Error(`Date "${value}" in row ${i + 1} must be in the future`);
                    }
                    
                    bill.issuedate = dateStr;
                } else {
                    // Handle field values
                    const field = billFields.find(f => f.field_name.toLowerCase() === header);
                    if (field) {
                        if (!value || value.trim() === '') {
                            throw new Error(`Empty value for "${field.field_name}" in row ${i + 1}`);
                        }
                        
                        // Validate field type
                        if (field.field_type === 'NUMBER') {
                            const num = parseFloat(value);
                            if (isNaN(num)) {
                                throw new Error(`Invalid number "${value}" for "${field.field_name}" in row ${i + 1}`);
                            }
                        } else if (field.field_type === 'DATE') {
                            let fieldDateStr = value;
                            if (value.includes('/')) {
                                const parts = value.split('/');
                                if (parts.length === 3) {
                                    fieldDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                }
                            }
                            const fieldDate = new Date(fieldDateStr);
                            if (isNaN(fieldDate.getTime())) {
                                throw new Error(`Invalid date "${value}" for "${field.field_name}" in row ${i + 1}`);
                            }
                        }
                        
                        bill.fields.push({
                            field_name: field.field_name,
                            field_value: value.trim()
                        });
                    }
                }
            });

            bills.push(bill);
        }

        return bills;
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setIsProcessingCsv(true);
        setError('');

        try {
            const content = await file.text();
            const parsedBills = parseCsvContent(content);
            
            // Add all parsed bills to the queue
            setBillsToAdd(prev => [...prev, ...parsedBills]);
            setError('');
            
        } catch (err) {
            setError(`CSV Error: ${err.message}`);
        } finally {
            setIsProcessingCsv(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const downloadCsvTemplate = () => {
        const headers = getRequiredCsvHeaders();
        const headerRow = headers.join(',');
        const exampleRow = headers.map(header => {
            if (header === 'amount') return '1200.50';
            if (header === 'issuedate') return '2025-07-25';
            return 'Example Value';
        }).join(',');
        
        const csvContent = `${headerRow}\n${exampleRow}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedBatch?.batchname || 'bills'}_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const removeBillFromQueue = (indexToRemove) => {
        setBillsToAdd(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleCommitBills = async () => {
        if (billsToAdd.length === 0) return;

        setIsCommitting(true);
        setError('');
        
        try {
            // Prepare bills data in the required format
            const billsData = billsToAdd.map(bill => ({
                amount: bill.amount,
                issuedate: bill.issuedate,
                fields: bill.fields
            }));

            // Send to backend
            const response = await axios.post(`/biller/create-bills/${selectedBatch.id}`, {
                bills: billsData
            });

            // Set commit result and move to final confirmation page
            setCommitResult({
                success: true,
                success_count: response.data.success_count || 0,
                failure_count: response.data.failure_count || 0,
                failed_entries: response.data.failed_entries || [],
                totalAttempted: billsData.length
            });
            setCurrentSection(5); // New section for results

        } catch (err) {
            // Handle error case
            setCommitResult({
                success: false,
                error: err.response?.data?.message || 'Failed to create bills. Please try again.',
                totalAttempted: billsToAdd.length
            });
            setCurrentSection(5); // Show error page
        } finally {
            setIsCommitting(false);
        }
    };

    const renderSection1 = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Select Bill Batch</h2>
            
            {/* Search Field */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Search batches by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 bg-white shadow-sm"
                />
            </div>

            {/* Batch List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredBatches.map((batch) => (
                    <div
                        key={batch.batchid}
                        onClick={() => handleBatchSelect(batch)}
                        className="p-5 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{batch.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">ID: {batch.id}</p>
                                {/* <p className="text-sm text-gray-600 mt-2">{batch.description || 'No description'}</p> */}
                            </div>
                            <div className="text-right ml-4">
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                                    {batch.recurrenceType}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Started: {formatDate(batch.startDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredBatches.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                    <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No batches found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                </div>
            )}
        </div>
    );

    const renderSection2 = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setCurrentSection(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold">Bill Creator</h2>
            </div>

            {/* Selected Batch Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="font-semibold text-blue-900 text-lg mb-3">Selected Batch Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Batch Name</p>
                        <p className="text-blue-900 font-semibold">{selectedBatch?.batchname}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Batch ID</p>
                        <p className="text-blue-900 font-mono text-sm">{selectedBatch?.batchid}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Required Fields</p>
                        <p className="text-blue-900 font-semibold">{billFields.length} fields</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Recurrence Type</p>
                        <p className="text-blue-900 font-semibold">{selectedBatch?.recurrencetype}</p>
                    </div>
                </div>
            </div>

            {/* Bills Counter and Add Button */}
            <div className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-xl bg-white shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-medium">Bills to be created</p>
                        <p className="text-2xl font-bold text-blue-600">{billsToAdd.length}</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleAddNewBill}
                        className="flex items-center space-x-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add New Bill</span>
                    </button>
                </div>
            </div>

            {/* CSV Upload Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-purple-900 text-lg">Bulk Upload from CSV</h3>
                    <button
                        onClick={downloadCsvTemplate}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm text-sm"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download Template</span>
                    </button>
                </div>
                
                <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                        isDragOver 
                            ? 'border-purple-400 bg-purple-100' 
                            : 'border-purple-300 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="text-center">
                        {isProcessingCsv ? (
                            <div className="flex flex-col items-center space-y-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                <p className="text-purple-700 font-medium">Processing CSV file...</p>
                            </div>
                        ) : (
                            <>
                                <svg className="mx-auto h-12 w-12 text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-lg font-medium text-purple-900 mb-2">
                                    Drag & drop your CSV file here
                                </p>
                                <p className="text-sm text-purple-700 mb-4">
                                    or click to browse files
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="bg-white px-4 py-2 rounded-lg border border-purple-300 inline-block">
                                    <span className="text-sm font-medium text-purple-700">Choose CSV File</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-sm text-purple-700">
                    <p className="font-medium mb-2">Required CSV Headers:</p>
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <code className="text-purple-800 font-mono text-xs">
                            {getRequiredCsvHeaders().join(', ')}
                        </code>
                    </div>
                    <p className="mt-2 text-xs text-purple-600">
                        • Use comma-separated values • Date format: yyyy-mm-dd • All dates must be in the future
                    </p>
                </div>
            </div>

            {/* Bills Table */}
            {billsToAdd.length > 0 && (
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <h3 className="font-semibold text-gray-900">Bills Queue ({billsToAdd.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Start Date</th>
                                    {billFields.map((field) => (
                                        <th key={field.field_name} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            {formatFieldName(field.field_name)}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {billsToAdd.map((bill, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-green-600">৳{bill.amount}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{formatDate(bill.issuedate)}</td>
                                        {bill.fields.map((field, fieldIndex) => (
                                            <td key={fieldIndex} className="px-6 py-4 text-sm">
                                                {field.field_value}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => removeBillFromQueue(index)}
                                                className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove bill from queue"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Commit Button */}
            <div className="flex justify-end">{!commitResult && (
                <button
                    onClick={handleCommitBills}
                    disabled={billsToAdd.length === 0 || isCommitting}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                        billsToAdd.length === 0 || isCommitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                    }`}
                >
                    {isCommitting ? (
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Creating Bills...</span>
                        </div>
                    ) : (
                        `Commit Bills (${billsToAdd.length})`
                    )}
                </button>
            )}
            </div>
        </div>
    );

    const renderSection3 = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setCurrentSection(2)}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-xl font-semibold">Bill Basic Information</h2>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Enter Bill Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800">
                            Bill Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">৳</span>
                            <input
                                type="number"
                                name="amount"
                                value={currentBillForm.amount}
                                onChange={handleBillFormChange}
                                step="0.01"
                                min="0.01"
                                required
                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 bg-white shadow-sm"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Issue Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800">
                            Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            name="issuedate"
                            value={currentBillForm.issuedate}
                            onChange={handleBillFormChange}
                            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 bg-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => setCurrentSection(2)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleBasicInfoNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Next: Fill Fields
                </button>
            </div>
        </div>
    );

    const renderSection4 = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setCurrentSection(3)}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-xl font-semibold">Bill Field Information</h2>
            </div>

            {/* Summary of basic info */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-2">Bill Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-medium">৳{currentBillForm.amount}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Start Date:</span>
                        <span className="ml-2 font-medium">{formatDate(currentBillForm.issuedate)}</span>
                    </div>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddBill(); }} className="space-y-6">
                {billFields.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                        <h3 className="text-lg font-medium text-green-900 mb-4">
                            Required Fields ({billFields.length})
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {billFields.map((field, index) => (
                                <div key={field.field_name} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        <span className="flex items-center space-x-2">
                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                                {index + 1}
                                            </span>
                                            <span>{formatFieldName(field.field_name)}</span>
                                            <span className="text-red-500">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type={field.field_type === 'NUMBER' ? 'number' : field.field_type === 'DATE' ? 'date' : 'text'}
                                        name={field.field_name}
                                        value={currentBillForm.fields[field.field_name] || ''}
                                        onChange={handleBillFormChange}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-900 bg-white shadow-sm"
                                        placeholder={`Enter ${formatFieldName(field.field_name).toLowerCase()}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {billFields.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        No additional fields required for this batch
                    </div>
                )}

                {/* Add Bill Button */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => setCurrentSection(3)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                        Add Bill to Queue
                    </button>
                </div>
            </form>
        </div>
    );

    const renderSection5 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Creation Results</h2>
                <p className="text-gray-600">Summary of your bill creation request</p>
            </div>

            {commitResult?.success ? (
                // Success Case
                <div className="space-y-6">
                    {/* Success Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                        <div className="text-center mb-6">
                            <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bills Processing Complete</h3>
                            <p className="text-gray-600">
                                Processed {commitResult.totalAttempted} bill{commitResult.totalAttempted !== 1 ? 's' : ''} for batch: <span className="font-medium">{selectedBatch?.batchname}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-green-100 p-6 rounded-lg border border-green-200 text-center">
                                <div className="flex items-center justify-center space-x-3 mb-2">
                                    <div className="bg-green-500 p-2 rounded-full">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-semibold text-green-800">Successfully Created</h4>
                                </div>
                                <p className="text-3xl font-bold text-green-600">{commitResult.success_count}</p>
                            </div>
                            
                            <div className="bg-red-100 p-6 rounded-lg border border-red-200 text-center">
                                <div className="flex items-center justify-center space-x-3 mb-2">
                                    <div className="bg-red-500 p-2 rounded-full">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-semibold text-red-800">Failed to Create</h4>
                                </div>
                                <p className="text-3xl font-bold text-red-600">{commitResult.failure_count}</p>
                            </div>
                        </div>
                    </div>

                    {/* Failed Entries Section */}
                    {commitResult.failure_count > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-red-900">Failed Entries</h3>
                                <button
                                    onClick={() => setShowFailedEntries(!showFailedEntries)}
                                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>{showFailedEntries ? 'Hide' : 'View'} Details</span>
                                </button>
                            </div>

                            {showFailedEntries && (
                                <div className="border-2 border-red-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-red-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Amount</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-red-700">Start Date</th>
                                                    {billFields.map((field) => (
                                                        <th key={field.field_name} className="px-6 py-4 text-left text-sm font-semibold text-red-700">
                                                            {formatFieldName(field.field_name)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-200">
                                                {commitResult.failed_entries.map((bill, index) => (
                                                    <tr key={index} className="hover:bg-red-50">
                                                        <td className="px-6 py-4 text-sm font-medium text-red-600">৳{bill.amount}</td>
                                                        <td className="px-6 py-4 text-sm font-medium">{formatDate(bill.issuedate)}</td>
                                                        {bill.fields.map((field, fieldIndex) => (
                                                            <td key={fieldIndex} className="px-6 py-4 text-sm">
                                                                {field.field_value}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4 pt-6">
                        {commitResult.failure_count > 0 && (
                            <button
                                onClick={() => {
                                    setBillsToAdd(commitResult.failed_entries);
                                    setCommitResult(null);
                                    setShowFailedEntries(false);
                                    setCurrentSection(2);
                                }}
                                className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Retry Failed Entries</span>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setBillsToAdd([]);
                                setCommitResult(null);
                                setSelectedBatch(null);
                                setBillFields([]);
                                setShowFailedEntries(false);
                                setCurrentSection(1);
                            }}
                            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Complete</span>
                        </button>
                    </div>
                </div>
            ) : (
                // Error Case
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-8 rounded-xl border-2 border-red-200 text-center">
                        <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-red-900 mb-4">Bill Creation Failed</h3>
                        <p className="text-red-700 mb-6 text-lg">
                            {commitResult?.error || 'An unexpected error occurred while creating bills.'}
                        </p>
                        
                        <div className="bg-red-100 p-4 rounded-lg border border-red-200 mb-6">
                            <p className="text-sm text-red-800">
                                <span className="font-medium">Bills Attempted:</span> {commitResult?.totalAttempted || 0}
                            </p>
                        </div>
                        
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => {
                                    setCommitResult(null);
                                    setCurrentSection(2);
                                }}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Try Again</span>
                            </button>
                            <button
                                onClick={() => {
                                    setBillsToAdd([]);
                                    setCommitResult(null);
                                    setSelectedBatch(null);
                                    setBillFields([]);
                                    setCurrentSection(1);
                                }}
                                className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[150] bg-black bg-opacity-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl h-full max-h-[95vh] overflow-hidden">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h1 className="text-2xl font-bold">Create Bills</h1>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-800"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        {currentSection === 1 && renderSection1()}
                        {currentSection === 2 && renderSection2()}
                        {currentSection === 3 && renderSection3()}
                        {currentSection === 4 && renderSection4()}
                        {currentSection === 5 && renderSection5()}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AssignBill;
