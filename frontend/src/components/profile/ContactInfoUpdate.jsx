// src/components/profile/ContactInfoUpdate.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  ArrowLeft, 
  Check, 
  X, 
  Loader2 
} from 'lucide-react';

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const ContactInfoUpdate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    phonenumber: '',
    addressline1: '',
    addressline2: '',
    city: '',
    state: '',
    country: '',
    postalcode: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, loading, available, unavailable
  const [phoneStatus, setPhoneStatus] = useState('idle');
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    fetchContactData();
  }, [user]);

  const fetchContactData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/user/profileData/${user.accountid}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contact data');
      }
      
      const data = await response.json();
      const contactData = data.contact || {};
      
      setFormData(contactData);
      setOriginalData(contactData);
      setError('');
    } catch (err) {
      setError('Failed to load contact data');
      console.error('Contact fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEmail = useCallback(
    debounce(async (email) => {
      if (!email || email === originalData.email) {
        setEmailStatus('idle');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailStatus('idle');
        return;
      }

      try {
        setEmailStatus('loading');
        const response = await fetch(`/auth/check-email/${encodeURIComponent(email)}`);
        const data = await response.json();
        
        setEmailStatus(data.available ? 'available' : 'unavailable');
      } catch (error) {
        console.error('Email check error:', error);
        setEmailStatus('idle');
      }
    }, 500),
    [originalData.email]
  );

  const checkPhone = useCallback(
    debounce(async (phone) => {
      if (!phone || phone === originalData.phonenumber) {
        setPhoneStatus('idle');
        return;
      }

      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setPhoneStatus('idle');
        return;
      }

      try {
        setPhoneStatus('loading');
        const response = await fetch(`http://localhost:3000/auth/check-phone/${encodeURIComponent(phone)}`);
        const data = await response.json();
        
        setPhoneStatus(data.available ? 'available' : 'unavailable');
      } catch (error) {
        console.error('Phone check error:', error);
        setPhoneStatus('idle');
      }
    }, 500),
    [originalData.phonenumber]
  );

  useEffect(() => {
    if (formData.email) {
      checkEmail(formData.email);
    }
  }, [formData.email, checkEmail]);

  useEffect(() => {
    if (formData.phonenumber) {
      checkPhone(formData.phonenumber);
    }
  }, [formData.phonenumber, checkPhone]);

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
    if (!formData.email || !formData.phonenumber) {
      setError('Email and phone number are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (emailStatus === 'unavailable') {
      setError('This email is already in use');
      return false;
    }

    if (phoneStatus === 'unavailable') {
      setError('This phone number is already in use');
      return false;
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
          tableName: 'contactinfo',
          updates: {
            email: formData.email,
            phonenumber: formData.phonenumber,
            addressline1: formData.addressline1 || '',
            addressline2: formData.addressline2 || '',
            city: formData.city || '',
            state: formData.state || '',
            country: formData.country || '',
            postalcode: formData.postalcode || ''
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to update contact information');
      }

      setSuccess('Contact information updated successfully!');
      setOriginalData(formData);
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError('Failed to update contact information');
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderEmailStatus = () => {
    if (emailStatus === 'loading') {
      return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
    }
    if (emailStatus === 'available') {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (emailStatus === 'unavailable') {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const renderPhoneStatus = () => {
    if (phoneStatus === 'loading') {
      return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
    }
    if (phoneStatus === 'available') {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (phoneStatus === 'unavailable') {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
    'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
    'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
    'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
    'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
    'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
    'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
    'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
    'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
    'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
    'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
    'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
    'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
    'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
    'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
    'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
    'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
    'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
    'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
    'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
    'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen', 'Zambia', 'Zimbabwe'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                Update Contact Information
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Keep your contact information up to date
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
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="Enter your email address"
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5">
                  {renderEmailStatus()}
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="Enter your phone number"
                  required
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5">
                  {renderPhoneStatus()}
                </div>
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="addressline1"
                  value={formData.addressline1}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="Street address, P.O. box, company name"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
              </div>
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line 2 (optional)
              </label>
              <input
                type="text"
                name="addressline2"
                value={formData.addressline2}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalcode"
                  value={formData.postalcode}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="ZIP/Postal Code"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving || emailStatus === 'unavailable' || phoneStatus === 'unavailable'}
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

export default ContactInfoUpdate;
