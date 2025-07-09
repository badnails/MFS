// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameValid, setUsernameValid] = useState(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    //setError('');
    if (e.target.name === 'username') {
      setUsernameValid(null);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability(formData.username);
      } else {
        setUsernameValid(null);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [formData.username]);

  const checkUsernameAvailability = async (username) => {
    setUsernameCheckLoading(true);
    try {
      const res = await axios.get(`/auth/check-username/${username}`);
      if(res.data.valid)  //Username available
      {
        setUsernameValid(false);
        setError("Username not registered");
      }
      else
      {
        setError('');
        setUsernameValid(true);
      }
    } catch (err) {
        console.log(err);
        setUsernameValid(false);
        setError('Failed to check username availability.');
    } finally {
      setUsernameCheckLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (usernameValid === null || usernameValid === false) {
      setError('Username not found or not checked.');
      setLoading(false);
      return;
    }

    try {
      const getGeolocation = () => {
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                console.error("Error getting user's location:", error);
                resolve(null);
              }
            );
          } else {
            console.error('Geolocation is not supported by this browser.');
            resolve(null);
          }
        });
      };

      const location = await getGeolocation();

      const response = await axios.post('/auth/loginUserInit', formData, {
        headers: {
          'X-User-Location': location ? JSON.stringify(location) : undefined,
        },
      });
      
      const {token , user} = response.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {usernameCheckLoading && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                  </div>
                )}
                {!usernameCheckLoading && usernameValid === true && ( // Username exists
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
                {!usernameCheckLoading && usernameValid === false && ( // Username does not exist
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || usernameCheckLoading || usernameValid === false || !formData.username || !formData.password}
            className={`w-full btn-primary flex items-center justify-center ${loading || usernameCheckLoading || usernameValid === false || !formData.username || !formData.password ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;