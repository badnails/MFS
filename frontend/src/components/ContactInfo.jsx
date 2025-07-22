// src/components/ContactInfo.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Home } from 'lucide-react';
import axios from 'axios';

const ContactInfo = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { accountid, accountType, previousStep } = location.state || {};

    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        addressline1: '',
        addressline2: '',

        city: '',
        state: '',
        zipcode: '',
        country: ''
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

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validation
            if (!formData.email || !formData.phone || !formData.addressline1 || !formData.city || !formData.country) {
                setError('Please fill all required fields.');
                setLoading(false);
                return;
            }

            if (!validateEmail(formData.email)) {
                setError('Please enter a valid email address.');
                setLoading(false);
                return;
            }

            if (!validatePhone(formData.phone)) {
                setError('Please enter a valid phone number.');
                setLoading(false);
                return;
            }

            const response = await axios.post('/auth/contactinfo', {
                formData,
                accountid
            });

            if (response.status === 200) {
                console.log('Contact info submitted successfully:', response.data);
                navigate('/completion', {
                    state: {
                        accountid,
                        accountType,
                        message: 'Account setup completed successfully!'
                    }
                });
            } else {
                setError('Something went wrong. Please try again.');
            }
        } catch (err) {
            //console.error('Submission error:', err);
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
                            <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                            Contact Information
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Please provide your contact details to complete your account setup
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
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                                        placeholder="Enter your email address"
                                        required
                                    />
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Phone Number *
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Street Address 1
                            </label>
                            <div className="relative">
                                <textarea
                                    name="addressline1"
                                    value={formData.addressline1}
                                    onChange={handleChange}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                                    placeholder="Enter your complete address"
                                    required
                                />
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Street Address 2
                            </label>
                            <div className="relative">
                                <textarea
                                    name="addressline2"
                                    value={formData.addressline2}
                                    onChange={handleChange}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                                    placeholder="Enter your complete address"
                                    required
                                />
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                                    placeholder="Enter your city"
                                    required
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
                                    placeholder="Enter your state/province"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    ZIP/Postal Code
                                </label>
                                <input
                                    type="text"
                                    name="zipcode"
                                    value={formData.zipcode}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                                    placeholder="Enter your ZIP/postal code"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Country *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                                        placeholder="Enter your country"
                                        required
                                    />
                                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
                                </div>
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
                                    'Complete Setup'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactInfo;
