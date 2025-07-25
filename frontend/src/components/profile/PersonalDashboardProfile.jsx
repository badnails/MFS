// src/components/profile/PersonalDashboardProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfilePictureDisplay from './ProfilePictureDisplay';
import ProfilePictureUpload from './ProfilePictureUpload';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Edit3, 
  Shield,
  CreditCard,
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PersonalDashboardProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPictureUpload, setShowPictureUpload] = useState(false);
  const [pictureRefreshTrigger, setPictureRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/user/profileData/${user.accountid}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      setProfileData(data);
      setError('');
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePictureUploadSuccess = () => {
    setPictureRefreshTrigger(prev => prev + 1);
    setShowPictureUpload(false);
  };

  const handlePictureDeleteSuccess = () => {
    setPictureRefreshTrigger(prev => prev + 1);
    setShowPictureUpload(false);
  };

  const handleEditPicture = () => {
    setShowPictureUpload(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isIndividualAccount = user?.accounttype === 'PERSONAL' || user?.accounttype === 'AGENT';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your account information and settings</p>
        </div>

        {/* Account Overview Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profileData?.account?.accountstatus === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {profileData?.account?.accountstatus || 'Unknown'}
            </span>
          </div>
          
          {/* Profile Picture Section - For All Account Types */}
          <div className="flex items-center justify-center mb-6">
            <ProfilePictureDisplay
              size="xlarge"
              showEditButton={true}
              onEditClick={handleEditPicture}
              refreshTrigger={pictureRefreshTrigger}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium">{profileData?.account?.username || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Account ID</p>
                <p className="font-medium">{profileData?.account?.accountid || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-medium capitalize">{user?.accounttype?.toLowerCase() || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal/Institutional Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isIndividualAccount ? 'Personal Information' : 'Business Information'}
              </h3>
              <button
                onClick={() => navigate(isIndividualAccount ? '/profile/personal-info' : '/profile/institutional-info')}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>

            {isIndividualAccount ? (
              /* Personal Information */
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">
                      {profileData?.individual ? 
                        `${profileData.individual.firstname || ''} ${profileData.individual.lastname || ''}`.trim() || 'Not set'
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formatDate(profileData?.individual?.dateofbirth)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium capitalize">
                      {profileData?.individual?.gender?.toLowerCase() || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-medium">{profileData?.individual?.nationality || 'Not set'}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Institutional Information */
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Business Name</p>
                    <p className="font-medium">{profileData?.institutional?.merchantname || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="font-medium">
                      {profileData?.institutional?.websiteurl ? (
                        <a 
                          href={profileData.institutional.websiteurl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {profileData.institutional.websiteurl}
                        </a>
                      ) : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <button
                onClick={() => navigate('/profile/contact-info')}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profileData?.contact?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{profileData?.contact?.phonenumber || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <div className="font-medium">
                    {profileData?.contact ? (
                      <>
                        {profileData.contact.addressline1 && <p>{profileData.contact.addressline1}</p>}
                        {profileData.contact.addressline2 && <p>{profileData.contact.addressline2}</p>}
                        {(profileData.contact.city || profileData.contact.state || profileData.contact.postalcode) && (
                          <p>
                            {[profileData.contact.city, profileData.contact.state, profileData.contact.postalcode]
                              .filter(Boolean).join(', ')}
                          </p>
                        )}
                        {profileData.contact.country && <p>{profileData.contact.country}</p>}
                      </>
                    ) : (
                      <p>Not set</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/profile/totp-recovery')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Key className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">TOTP Recovery</p>
                <p className="text-sm text-gray-500">Regenerate your authenticator QR code</p>
              </div>
            </button>
            <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Enabled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      
      {/* Profile Picture Upload Modal */}
      <ProfilePictureUpload
        currentPicture={isIndividualAccount ? profileData?.individual?.has_profile_picture : profileData?.institutional?.has_profile_picture}
        onUploadSuccess={handlePictureUploadSuccess}
        onDeleteSuccess={handlePictureDeleteSuccess}
        isOpen={showPictureUpload}
        onClose={() => setShowPictureUpload(false)}
      />
    </div>
  );
};

export default PersonalDashboardProfile;
