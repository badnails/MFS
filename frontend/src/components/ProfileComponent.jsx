// ProfileComponent.jsx - Modified version with Update button
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../ProfileComponent.css';

const EditableField = React.memo(({ label, section, fieldName, value, type = 'text', disabled = false, isEditing, handleInputChange }) => {
  try {
    return (
      <div className="profile-field">
        <label>{label}:</label>
        {isEditing && !disabled ? (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => handleInputChange(section, fieldName, e.target.value)}
            className="profile-input"
          />
        ) : (
          <span className="profile-value">{value || 'Not set'}</span>
        )}
      </div>
    );
  } catch (error) {
    console.error("EditableField render error:", error);
    return <div style={{ color: 'red' }}>Error rendering field: {label}</div>;
  }
});


const ProfileComponent = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && user?.accountid) {
      fetchProfileData();
    }
  }, [isOpen, user]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/user/profileData/${user.accountid}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProfileData(data);
      // Initialize edited data
      setEditedData({
        individual: data.individual || {},
        institutional: data.institutional || {},
        contact: data.contact || {}
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((section, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  }, []);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const updates = [];
      
      // Check for individual info changes
      if (profileData?.individual) {
        const individualChanges = {};
        Object.keys(editedData.individual).forEach(key => {
          if (editedData.individual[key] !== profileData.individual[key]) {
            individualChanges[key] = editedData.individual[key];
          }
        });
        if (Object.keys(individualChanges).length > 0) {
          updates.push({
            tableName: 'individualinfo',
            updates: individualChanges
          });
        }
      }

      // Check for institutional info changes
      if (profileData?.institutional) {
        const institutionalChanges = {};
        Object.keys(editedData.institutional).forEach(key => {
          if (editedData.institutional[key] !== profileData.institutional[key]) {
            institutionalChanges[key] = editedData.institutional[key];
          }
        });
        if (Object.keys(institutionalChanges).length > 0) {
          updates.push({
            tableName: 'institutionalinfo',
            updates: institutionalChanges
          });
        }
      }

      // Check for contact info changes
      if (profileData?.contact) {
        const contactChanges = {};
        Object.keys(editedData.contact).forEach(key => {
          if (editedData.contact[key] !== profileData.contact[key]) {
            contactChanges[key] = editedData.contact[key];
          }
        });
        if (Object.keys(contactChanges).length > 0) {
          updates.push({
            tableName: 'contactinfo',
            updates: contactChanges
          });
        }
      }

      // Execute all updates
      for (const update of updates) {
        const response = await fetch('http://localhost:3000/user/updateProfile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            accountid: user.accountid,
            tableName: update.tableName,
            updates: update.updates
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update');
        }
      }

      // Refresh profile data
      await fetchProfileData();
      setIsEditing(false);
      alert('Profile updated successfully!');

    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };




  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <h2>Profile Information</h2>
          <div className="header-buttons">
            {!isEditing ? (
              <button 
                className="edit-profile-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            ) : (
              <div className="edit-buttons">
                <button 
                  className="update-btn"
                  onClick={handleUpdateProfile}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset edited data
                    setEditedData({
                      individual: profileData?.individual || {},
                      institutional: profileData?.institutional || {},
                      contact: profileData?.contact || {}
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Loading profile...</div>
        ) : (
          <div className="profile-content">
            {/* Account Information - Read Only */}
            <section className="profile-section">
              <h3>Account Information</h3>
              <div className="profile-field">
                <label>Username:</label>
                <span className="profile-value">{profileData?.account?.username}</span>
              </div>
              <div className="profile-field">
                <label>Account Type:</label>
                <span className="profile-value">{profileData?.account?.accounttype}</span>
              </div>
              <div className="profile-field">
                <label>Account Tier:</label>
                <span className="profile-value">{profileData?.account?.tiertype}</span>
              </div>
              <div className="profile-field">
                <label>Available Balance:</label>
                <span className="profile-value">${profileData?.account?.availablebalance}</span>
              </div>
            </section>

            {/* Personal/Individual Information */}
            {profileData?.individual && (
              <section className="profile-section">
                <h3>Personal Information</h3>
                <EditableField 
                  label="First Name" 
                  value={isEditing ? editedData.individual?.firstname : profileData.individual.firstname}
                  section="individual"
                  fieldName="firstname"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Last Name" 
                  value={isEditing ? editedData.individual?.lastname : profileData.individual.lastname}
                  section="individual"
                  fieldName="lastname"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Date of Birth" 
                  value={isEditing ? editedData.individual?.dateofbirth : profileData.individual.dateofbirth}
                  section="individual"
                  fieldName="dateofbirth"
                  type="date"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Gender" 
                  value={isEditing ? editedData.individual?.gender : profileData.individual.gender}
                  section="individual"
                  fieldName="gender"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Nationality" 
                  value={isEditing ? editedData.individual?.nationality : profileData.individual.nationality}
                  section="individual"
                  fieldName="nationality"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
              </section>
            )}

            {/* Institutional Information */}
            {profileData?.institutional && (
              <section className="profile-section">
                <h3>Business Information</h3>
                <EditableField 
                  label="Merchant Name" 
                  value={isEditing ? editedData.institutional?.merchantname : profileData.institutional.merchantname}
                  section="institutional"
                  fieldName="merchantname"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Website URL" 
                  value={isEditing ? editedData.institutional?.websiteurl : profileData.institutional.websiteurl}
                  section="institutional"
                  fieldName="websiteurl"
                  type="url"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <div className="profile-field">
                  <label>Category:</label>
                  <span className="profile-value">{profileData.institutional.category_name}</span>
                </div>
              </section>
            )}

            {/* Contact Information */}
            {profileData?.contact && (
              <section className="profile-section">
                <h3>Contact Information</h3>
                <EditableField 
                  label="Email" 
                  value={isEditing ? editedData.contact?.email : profileData.contact.email}
                  section="contact"
                  fieldName="email"
                  type="email"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Phone Number" 
                  value={isEditing ? editedData.contact?.phonenumber : profileData.contact.phonenumber}
                  section="contact"
                  fieldName="phonenumber"
                  type="tel"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Address Line 1" 
                  value={isEditing ? editedData.contact?.addressline1 : profileData.contact.addressline1}
                  section="contact"
                  fieldName="addressline1"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Address Line 2" 
                  value={isEditing ? editedData.contact?.addressline2 : profileData.contact.addressline2}
                  section="contact"
                  fieldName="addressline2"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="City" 
                  value={isEditing ? editedData.contact?.city : profileData.contact.city}
                  section="contact"
                  fieldName="city"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="State" 
                  value={isEditing ? editedData.contact?.state : profileData.contact.state}
                  section="contact"
                  fieldName="state"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Country" 
                  value={isEditing ? editedData.contact?.country : profileData.contact.country}
                  section="contact"
                  fieldName="country"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
                <EditableField 
                  label="Postal Code" 
                  value={isEditing ? editedData.contact?.postalcode : profileData.contact.postalcode}
                  section="contact"
                  fieldName="postalcode"
                  isEditing={isEditing}
                  handleInputChange={handleInputChange}
                />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileComponent;
