// src/components/profile/InstitutionalInfoUpdate.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Globe, 
  Save, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';

const InstitutionalInfoUpdate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    merchantname: '',
    websiteurl: '',
    category_id: 1
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInstitutionalData();
  }, [user]);

  const fetchInstitutionalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/user/profileData/${user.accountid}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch institutional data');
      }
      
      const data = await response.json();
      const institutionalData = data.institutional || {};
      
      setFormData(institutionalData);
      setError('');
    } catch (err) {
      setError('Failed to load institutional data');
      console.error('Institutional data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.merchantname?.trim()) {
      setError(`${user?.accounttype === 'MERCHANT' ? 'Merchant' : 'Biller'} name is required`);
      return false;
    }

    // Validate website URL if provided
    if (formData.websiteurl && formData.websiteurl.trim()) {
      try {
        new URL(formData.websiteurl);
      } catch (error) {
        setError('Please enter a valid website URL (e.g., https://example.com)');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');

      const response = await fetch('http://localhost:3000/user/updateProfile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountid: user.accountid,
          tableName: 'institutionalinfo',
          updates: {
            merchantname: formData.merchantname,
            websiteurl: formData.websiteurl || '',
            category_id: formData.category_id || 1
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to update institutional information');
      }

      setSuccess('Business information updated successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError('Failed to update business information');
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const accountTypeName = user?.accounttype === 'MERCHANT' ? 'Merchant' : 'Biller';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </button>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                Update {accountTypeName} Information
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Keep your business information current and accurate
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {accountTypeName} Name *
              </label>
              <input
                type="text"
                name="merchantname"
                value={formData.merchantname}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                placeholder={`Enter your ${accountTypeName.toLowerCase()} name`}
                required
              />
            </div>

            {/* Website URL */}
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
              <p className="mt-1 text-sm text-gray-500">
                Include the full URL including https:// or http://
              </p>
            </div>

            {/* Category (if applicable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Business Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
              >
                <option value={1}>General Business</option>
                <option value={2}>Retail</option>
                <option value={3}>Technology</option>
                <option value={4}>Healthcare</option>
                <option value={5}>Education</option>
                <option value={6}>Finance</option>
                <option value={7}>Food & Beverage</option>
                <option value={8}>Transportation</option>
                <option value={9}>Entertainment</option>
                <option value={10}>Utilities</option>
                <option value={11}>Telecommunications</option>
                <option value={12}>Other</option>
              </select>
            </div>

            {/* Information Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Business Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure your business name matches your official registration</li>
                      <li>Website URL will be displayed to customers during transactions</li>
                      <li>Category helps in transaction categorization and reporting</li>
                      {user?.accounttype === 'MERCHANT' && (
                        <li>This information may be used for payment processing verification</li>
                      )}
                      {user?.accounttype === 'BILLER' && (
                        <li>This information appears on bills issued to customers</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalInfoUpdate;
