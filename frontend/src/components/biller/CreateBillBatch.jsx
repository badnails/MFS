import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const recurrenceOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'MINUTELY', label: 'Minutely' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' }
];

const fieldTypeOptions = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' }
];

const durationUnitOptions = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' }
];

const CreateBillBatch = ({ onClose }) => {
  const [currentSection, setCurrentSection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchNameAvailable, setBatchNameAvailable] = useState(null);
  const [batchNameChecking, setBatchNameChecking] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);

  // Section 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    batchname: '',
    description: ''
  });

  // Section 2: Schedule Info
  const [scheduleInfo, setScheduleInfo] = useState({
    startdate: '',
    recurrencetype: 'monthly',
    default_duration_amount: '1',
    default_duration_unit: 'days'
  });

  // Section 3: Penalty Info
  const [penaltyInfo, setPenaltyInfo] = useState({
    penalty_rate: '',
    min_penalty: '',
    max_penalty: '',
    penalty_period_amount: '1',
    penalty_period_unit: 'days'
  });

  // Section 4: Dynamic Fields
  const [dynamicFields, setDynamicFields] = useState([
    { field_name: '', field_type: 'TEXT' }
  ]);

  // Check batch name availability
  const checkBatchNameAvailability = async (batchname) => {
    if (!batchname.trim()) {
      setBatchNameAvailable(null);
      return;
    }

    setBatchNameChecking(true);
    try {
      const response = await axios.get(`/biller/check-batch-name/${encodeURIComponent(batchname)}`);
      setBatchNameAvailable(response.data.available);
    } catch {
      setBatchNameAvailable(null);
    } finally {
      setBatchNameChecking(false);
    }
  };

  // Debounced batch name check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkBatchNameAvailability(basicInfo.batchname);
    }, 500);

    return () => clearTimeout(timer);
  }, [basicInfo.batchname]);

  const handleBasicInfoChange = (e) => {
    setBasicInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleScheduleInfoChange = (e) => {
    setScheduleInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePenaltyInfoChange = (e) => {
    setPenaltyInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addDynamicField = () => {
    setDynamicFields(prev => [...prev, { field_name: '', field_type: 'TEXT' }]);
  };

  const removeDynamicField = (index) => {
    if (dynamicFields.length > 1) {
      setDynamicFields(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDynamicFieldChange = (index, field, value) => {
    setDynamicFields(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const isSection1Valid = () => {
    return basicInfo.batchname.trim() && batchNameAvailable === true;
  };

  const isSection2Valid = () => {
    const today = new Date();
    const selectedDate = new Date(scheduleInfo.startdate);
    return scheduleInfo.startdate && 
           selectedDate > today && 
           scheduleInfo.recurrencetype && 
           scheduleInfo.default_duration_amount &&
           parseInt(scheduleInfo.default_duration_amount) > 0;
  };

  const isSection3Valid = () => {
    return penaltyInfo.penalty_rate !== '' && 
           penaltyInfo.min_penalty !== '' && 
           penaltyInfo.max_penalty !== '' && 
           penaltyInfo.penalty_period_amount &&
           parseInt(penaltyInfo.penalty_period_amount) > 0;
  };

  const isSection4Valid = () => {
    return dynamicFields.every(field => field.field_name.trim() && field.field_type);
  };

  const nextSection = () => {
    if (currentSection < 4) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Construct the default_duration and penalty_period in PostgreSQL interval format
      const default_duration = `${scheduleInfo.default_duration_amount} ${scheduleInfo.default_duration_unit}`;
      const penalty_period = `${penaltyInfo.penalty_period_amount} ${penaltyInfo.penalty_period_unit}`;
      
      const payload = {
        ...basicInfo,
        ...scheduleInfo,
        default_duration, // Override with constructed duration
        ...penaltyInfo,
        penalty_period, // Override with constructed penalty period
        dynamic_fields: dynamicFields
      };
      
      // Remove the separate amount and unit fields from payload
      delete payload.default_duration_amount;
      delete payload.default_duration_unit;
      delete payload.penalty_period_amount;
      delete payload.penalty_period_unit;

      const response = await axios.post('/biller/createbatch', payload);
      setCreatedBatch({
        ...payload,
        batchid: response.data.batchid
      });
      setCurrentSection(5); // Go to confirmation page
    } catch {
      setError('Failed to create batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSection1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Batch Name *</label>
        <div className="relative">
          <input
            type="text"
            name="batchname"
            required
            value={basicInfo.batchname}
            onChange={handleBasicInfoChange}
            className={`w-full border rounded px-3 py-2 mt-1 ${
              batchNameAvailable === false ? 'border-red-500' : 
              batchNameAvailable === true ? 'border-green-500' : 'border-gray-300'
            }`}
            placeholder="Enter unique batch name"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {batchNameChecking && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            )}
            {!batchNameChecking && batchNameAvailable === true && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {!batchNameChecking && batchNameAvailable === false && (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        {batchNameAvailable === false && (
          <p className="text-red-600 text-sm mt-1">This batch name is already taken</p>
        )}
        {batchNameAvailable === true && (
          <p className="text-green-600 text-sm mt-1">Batch name is available</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={basicInfo.description}
          onChange={handleBasicInfoChange}
          rows={3}
          className="w-full border rounded px-3 py-2 mt-1"
          placeholder="Enter batch description (optional)"
        />
      </div>
    </div>
  );

  const renderSection2 = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Schedule Configuration</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date *</label>
          <input
            type="date"
            name="startdate"
            required
            value={scheduleInfo.startdate}
            onChange={handleScheduleInfoChange}
            min={minDate}
            className="w-full border rounded px-3 py-2 mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Start date must be in the future</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Recurrence Type *</label>
          <select
            name="recurrencetype"
            value={scheduleInfo.recurrencetype}
            onChange={handleScheduleInfoChange}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            {recurrenceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Default Duration *</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="default_duration_amount"
              required
              value={scheduleInfo.default_duration_amount}
              onChange={handleScheduleInfoChange}
              className="w-1/2 border rounded px-3 py-2 mt-1"
              min="1"
              placeholder="Enter number"
            />
            <select
              name="default_duration_unit"
              value={scheduleInfo.default_duration_unit}
              onChange={handleScheduleInfoChange}
              className="w-1/2 border rounded px-3 py-2 mt-1"
            >
              {durationUnitOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">How long the bill will be valid for payment</p>
        </div>
      </div>
    );
  };

  const renderSection3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Penalty Configuration</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Penalty Rate (%) *</label>
        <input
          type="number"
          name="penalty_rate"
          required
          value={penaltyInfo.penalty_rate}
          onChange={handlePenaltyInfoChange}
          className="w-full border rounded px-3 py-2 mt-1"
          min="0"
          step="0.01"
          placeholder="Enter penalty rate"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Penalty (BDT) *</label>
          <input
            type="number"
            name="min_penalty"
            required
            value={penaltyInfo.min_penalty}
            onChange={handlePenaltyInfoChange}
            className="w-full border rounded px-3 py-2 mt-1"
            min="0"
            placeholder="Minimum penalty"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Penalty (BDT) *</label>
          <input
            type="number"
            name="max_penalty"
            required
            value={penaltyInfo.max_penalty}
            onChange={handlePenaltyInfoChange}
            className="w-full border rounded px-3 py-2 mt-1"
            min="0"
            placeholder="Maximum penalty"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Penalty Period *</label>
        <div className="flex gap-2">
          <input
            type="number"
            name="penalty_period_amount"
            required
            value={penaltyInfo.penalty_period_amount}
            onChange={handlePenaltyInfoChange}
            className="w-1/2 border rounded px-3 py-2 mt-1"
            min="1"
            placeholder="Enter number"
          />
          <select
            name="penalty_period_unit"
            value={penaltyInfo.penalty_period_unit}
            onChange={handlePenaltyInfoChange}
            className="w-1/2 border rounded px-3 py-2 mt-1"
          >
            {durationUnitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-1">How long after due date penalties are applied</p>
      </div>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
        <button
          type="button"
          onClick={addDynamicField}
          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </button>
      </div>
      
      <p className="text-sm text-gray-600">Define custom fields for your bills. At least one field is required.</p>

      <div className="space-y-3">
        {dynamicFields.map((field, index) => (
          <div key={index} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Field Name</label>
              <input
                type="text"
                value={field.field_name}
                onChange={(e) => handleDynamicFieldChange(index, 'field_name', e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
                placeholder="Enter field name"
                required
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Field Type</label>
              <select
                value={field.field_type}
                onChange={(e) => handleDynamicFieldChange(index, 'field_type', e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
                required
              >
                {fieldTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            {dynamicFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeDynamicField(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderConfirmation = () => {
    // Function to format date to dd-mm-yyyy
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        // Handle both yyyy-mm-dd and other date formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Batch Created Successfully!</h3>
          <p className="mt-2 text-sm text-gray-600">Your bill batch has been created with the following details:</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <span className="font-medium text-gray-700">Batch ID:</span>
            <span className="ml-2 text-gray-900">{createdBatch?.batchid}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Batch Name:</span>
            <span className="ml-2 text-gray-900">{createdBatch?.batchname}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Description:</span>
            <span className="ml-2 text-gray-900">{createdBatch?.description || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Start Date:</span>
            <span className="ml-2 text-gray-900">{formatDate(createdBatch?.startdate)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Recurrence:</span>
            <span className="ml-2 text-gray-900">{recurrenceOptions.find(opt => opt.value === createdBatch?.recurrencetype)?.label}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Default Duration:</span>
            <span className="ml-2 text-gray-900">{createdBatch?.default_duration}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Penalty Rate:</span>
            <span className="ml-2 text-gray-900">{createdBatch?.penalty_rate}%</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Min/Max Penalty:</span>
            <span className="ml-2 text-gray-900">{createdBatch?.min_penalty} - {createdBatch?.max_penalty} BDT</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Penalty Period:</span>
            <span className="ml-2 text-gray-900">{createdBatch?.penalty_period}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Custom Fields:</span>
            <div className="ml-2 mt-1">
              {createdBatch?.dynamic_fields?.map((field, index) => (
                <div key={index} className="text-sm text-gray-700">
                  {field.field_name} ({field.field_type})
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const canProceed = () => {
    switch (currentSection) {
      case 1: return isSection1Valid();
      case 2: return isSection2Valid();
      case 3: return isSection3Valid();
      case 4: return isSection4Valid();
      default: return false;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Create Bill Batch</h2>
            {currentSection < 5 && (
              <div className="flex items-center mt-2 space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step === currentSection
                        ? 'bg-indigo-600'
                        : step < currentSection
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  Step {currentSection} of 4
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {currentSection === 1 && renderSection1()}
          {currentSection === 2 && renderSection2()}
          {currentSection === 3 && renderSection3()}
          {currentSection === 4 && renderSection4()}
          {currentSection === 5 && renderConfirmation()}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {currentSection < 5 && (
          <div className="sticky bottom-0 bg-white border-t p-6 flex justify-between">
            <button
              onClick={prevSection}
              disabled={currentSection === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {currentSection < 4 ? (
              <button
                onClick={nextSection}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Batch'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CreateBillBatch;
