// src/components/Signup.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, QrCode, UserCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { debounce } from 'lodash';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    accounttype: 'PERSONAL'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpKey, setTotpKey] = useState('');
  const [showQR, setShowQR] = useState(false);
  
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle, loading, available, unavailable
  const [usernameError, setUsernameError] = useState('');
  const [passwordLength, setPasswordLength] = useState(null);
  const [passwordMatch, setPasswordMatch] = useState(null); // null, true, false

  const navigate = useNavigate();

  const checkUsername = useCallback(
    debounce(async (username) => {
      if (username.length < 3) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('loading');
      try {
        const res = await axios.get(`/auth/check-username/${username}`);
        if(res.data.valid)
        {
          setUsernameStatus('available');
          setUsernameError('');
        }
        else
        {
          setUsernameStatus('unavailable');
          setUsernameError('Username not available');
        }
      } catch (err) {
        setUsernameStatus('unavailable');
        setUsernameError(err.response?.data?.error || 'Username is taken');
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (formData.username) {
      checkUsername(formData.username);
    } else {
      setUsernameStatus('idle');
    }
  }, [formData.username, checkUsername]);

  useEffect(() => {
    if (formData.password) {
      setPasswordLength(formData.password.length >= 6);
    } else {
      setPasswordLength(null);
    }
    if (formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [formData.password, formData.confirmPassword]);

  // Account type options with descriptions
  const accountTypes = [
    {
      value: 'PERSONAL',
      label: 'Personal Account',
      description: 'For individual users to send money, pay bills, and manage finances',
      icon: '👤'
    },
    {
      value: 'AGENT',
      label: 'Agent Account',
      description: 'For agents to provide cash in/out services to customers',
      icon: '🏪'
    },
    {
      value: 'ADMIN',
      label: 'Admin Account',
      description: 'For system administrators to manage accounts and transactions',
      icon: '⚙️'
    },
    {
      value: 'MERCHANT',
      label: 'Merchant Account',
      description: 'For businesses to accept payments from customers',
      icon: '🏢'
    },
    {
      value: 'BILLER',
      label: 'Biller Account',
      description: 'For utility companies and service providers to collect bill payments',
      icon: '🧾'
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    if (e.target.name === 'username') {
      setUsernameStatus('loading');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordLength) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (usernameStatus !== 'available') {
      setError('Please choose an available username.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await axios.post('/auth/signup', submitData);
      
      const { qrURI, totpkey } = response.data;
      setQrCode(qrURI);
      setTotpKey(totpkey);
      setShowQR(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
      navigate('/login');
  };

  const getSelectedAccountType = () => {
    return accountTypes.find(type => type.value === formData.accounttype);
  };

  const renderUsernameStatus = () => {
    switch (usernameStatus) {
      case 'loading':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
      case 'available':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'unavailable':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (showQR) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <QrCode className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Setup Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Scan this QR code with your authenticator app
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <img src={qrCode} alt="QR Code" className="mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Or enter this key manually:
            </p>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all">
              {totpKey}
            </code>
          </div>

          <button
            onClick={handleContinue}
            className="w-full btn-primary"
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our mobile financial services platform
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Type *
              </label>
              <div className="space-y-2">
                {accountTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      formData.accounttype === type.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accounttype"
                      value={type.value}
                      checked={formData.accounttype === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">{type.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            formData.accounttype === type.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {type.label}
                          </span>
                          {formData.accounttype === type.value && (
                            <UserCheck className="ml-2 h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          formData.accounttype === type.value ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {type.description}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-field pr-10"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {renderUsernameStatus()}
                </div>
              </div>
              {usernameStatus === 'unavailable' && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {usernameError}
                </p>
              )}
              {usernameStatus === 'available' && (
                 <p className="mt-2 text-sm text-green-600">Username is available!</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-20"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
                  {passwordLength === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {passwordLength === false && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordLength === false && (
                <p className="mt-2 text-sm text-red-600">Password must be at least 6 characters.</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-20"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
                  {passwordMatch === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {passwordMatch === false && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordMatch === false && (
                <p className="mt-2 text-sm text-red-600">Passwords do not match.</p>
              )}
            </div>
          </div>

          {/* Selected Account Type Summary */}
          {formData.accounttype && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getSelectedAccountType()?.icon}</span>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Creating {getSelectedAccountType()?.label}
                  </p>
                  <p className="text-xs text-blue-700">
                    {getSelectedAccountType()?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || usernameStatus !== 'available' || !passwordLength || !passwordMatch}
            className={`w-full btn-primary flex items-center justify-center ${loading || usernameStatus !== 'available' || !passwordLength || !passwordMatch ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;