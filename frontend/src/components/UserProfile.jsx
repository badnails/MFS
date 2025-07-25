// src/components/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Globe, 
  Calendar, 
  Home,
  Edit2,
  Save,
  X,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Japan', 'China', 'India', 'Brazil', 'Other'
];

const genderOptions = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' }
];

const UserProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/profile');
      setProfileData(response.data);
      setFormData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      await axios.put('/user/profile', formData);
      
      setProfileData(formData);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setEditing(false);
    setError('');
  };

  const isIndividual = user?.accounttype === 'PERSONAL' || user?.accounttype === 'AGENT';
  const isInstitutional = user?.accounttype === 'MERCHANT' || user?.accounttype === 'BILLER';

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[75vh] overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500 capitalize">
                {user?.accounttype?.toLowerCase()} Account
              </p>
            </div>
          </div>
          
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Profile Content */}
      <div className="px-6 py-4">
        {/* Account Information Section */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{user?.accountid}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{user?.accounttype?.toLowerCase()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Name</label>
              <p className="mt-1 text-sm text-gray-900">{user?.accountname}</p>
            </div>
          </div>
        </div>

        {/* Personal/Agent Information */}
        {isIndividual && (
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {editing ? (
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.firstname || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {editing ? (
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.lastname || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                {editing ? (
                  <div className="relative">
                    <input
                      type="date"
                      name="dateofbirth"
                      value={formData.dateofbirth || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData?.dateofbirth ? new Date(profileData.dateofbirth).toLocaleDateString() : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                {editing ? (
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData?.gender ? genderOptions.find(g => g.value === profileData.gender)?.label : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nationality</label>
                {editing ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                      placeholder="Enter your nationality"
                    />
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.nationality || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Institutional Information */}
        {isInstitutional && (
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {user?.accounttype === 'MERCHANT' ? 'Merchant Name' : 'Biller Name'}
                </label>
                {editing ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="merchantname"
                      value={formData.merchantname || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                      placeholder={`Enter ${user?.accounttype === 'MERCHANT' ? 'merchant' : 'biller'} name`}
                    />
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.merchantname || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Website URL</label>
                {editing ? (
                  <div className="relative">
                    <input
                      type="url"
                      name="websiteurl"
                      value={formData.websiteurl || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                      placeholder="https://example.com"
                    />
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData?.websiteurl ? (
                      <a href={profileData.websiteurl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {profileData.websiteurl}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              {editing ? (
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    placeholder="Enter your email address"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData?.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              {editing ? (
                <div className="relative">
                  <input
                    type="tel"
                    name="phonenumber"
                    value={formData.phonenumber || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    placeholder="Enter your phone number"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData?.phonenumber || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-3">Address Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
              {editing ? (
                <div className="relative">
                  <input
                    type="text"
                    name="addressline1"
                    value={formData.addressline1 || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    placeholder="Enter your street address"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData?.addressline1 || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
              {editing ? (
                <input
                  type="text"
                  name="addressline2"
                  value={formData.addressline2 || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="Apartment, suite, unit, etc."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profileData?.addressline2 || 'Not provided'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                {editing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    placeholder="Enter your city"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.city || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                {editing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    placeholder="Enter your state/province"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.state || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP/Postal Code</label>
                {editing ? (
                  <input
                    type="text"
                    name="postalcode"
                    value={formData.postalcode || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                    placeholder="Enter your ZIP/postal code"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.postalcode || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                {editing ? (
                  <div className="relative">
                    <select
                      name="country"
                      value={formData.country || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1 appearance-none bg-white"
                    >
                      <option value="">Select your country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profileData?.country || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
