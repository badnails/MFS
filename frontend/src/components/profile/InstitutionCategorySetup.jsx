import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CategorySelector from '../common/CategorySelector';
import { 
  Building2, 
  Save, 
  ArrowLeft, 
  Loader2,
  MapPin,
  CheckCircle
} from 'lucide-react';

const InstitutionCategorySetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setError('');
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      setError('Please select a category before proceeding');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await axios.post('/auth/update-institution-category', {
        accountid: user.accountid,
        categoryId: selectedCategory.id
      });

      setSuccess('Category selected successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setError('Failed to update category. Please try again.');
      console.error('Category update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                Select Your Institution Category
              </h2>
              <p className="mt-2 text-lg text-gray-600">
                Help us categorize your business for better service delivery
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-600">{success}</p>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div className="p-6">
            <CategorySelector
              onCategorySelect={handleCategorySelect}
              showBreadcrumb={true}
            />
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Skip for now
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || !selectedCategory}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Category
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Information Section */}
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Why select a category?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Helps customers find your services more easily</li>
                    <li>Enables better transaction categorization and reporting</li>
                    <li>Allows for category-specific features and promotions</li>
                    <li>Improves compliance and regulatory reporting</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionCategorySetup;
