// src/components/PersonalAccountInfo.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Calendar, Globe } from 'lucide-react';
import axios from 'axios';

const genderOptions = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' }
];

const PersonalAccountInfo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accountType, accountid } = location.state || {};

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    dateofbirth: '',
    gender: '',
    nationality: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.firstname || !formData.lastname || 
          !formData.dateofbirth || !formData.nationality) {
        setError('Please fill all required fields.');
        setLoading(false);
        return;
      }

      const response = await axios.post('/auth/individualinfo', {
        isIndividual: true,
        formData,
        accountid
      });

      if (response.status === 200) {
        console.log('Personal info submitted successfully:', response.data);
        navigate('/contact-info', { 
          state: { 
            accountid,
            accountType,
            previousStep: 'personal-info'
          } 
        });
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="mb-8 text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
              Personal Information
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please provide your personal details to complete your {accountType.toLowerCase()} account setup
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateofbirth"
                    value={formData.dateofbirth}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                >
                  <option value="">Select gender</option>
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nationality *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="Enter your nationality"
                  required
                />
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Continue to Contact Info'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalAccountInfo;
