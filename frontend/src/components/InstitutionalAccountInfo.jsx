// src/components/InstitutionalAccountInfo.jsx
import React, { useState, useEffect } from 'react';
import { Building2, Globe } from 'lucide-react';

const InstitutionalAccountInfo = ({ 
  accountType, 
  onSubmit, 
  onBack, 
  loading, 
  existingData 
}) => {
  const [formData, setFormData] = useState({
    merchantname: '',
    websiteurl: '',
    category_id: 1
  });
  const [error, setError] = useState('');

  // Pre-populate form with existing data
  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.merchantname.trim()) {
      setError('Please enter merchant name.');
      return;
    }

    // Pass data to parent
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="mb-8 text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
              {accountType === 'MERCHANT' ? 'Merchant' : 'Biller'} Information
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please provide your business details to complete your {accountType?.toLowerCase()} account setup
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {accountType === 'MERCHANT' ? 'Merchant Name' : 'Biller Name'} *
              </label>
              <input
                type="text"
                name="merchantname"
                value={formData.merchantname}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                placeholder={`Enter your ${accountType === 'MERCHANT' ? 'merchant' : 'biller'} name`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website URL (optional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="websiteurl"
                  value={formData.websiteurl}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="https://example.com"
                />
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Contact Info
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalAccountInfo;
