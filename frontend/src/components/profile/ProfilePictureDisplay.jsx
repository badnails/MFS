// src/components/profile/ProfilePictureDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Camera, Edit3 } from 'lucide-react';

const ProfilePictureDisplay = ({ 
  size = 'medium', 
  showEditButton = false, 
  onEditClick,
  refreshTrigger = 0 // To force refresh after upload/delete
}) => {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-10 h-10',
      icon: 'h-4 w-4',
      editButton: 'w-6 h-6 -bottom-1 -right-1',
      editIcon: 'h-3 w-3'
    },
    medium: {
      container: 'w-16 h-16',
      icon: 'h-6 w-6',
      editButton: 'w-8 h-8 -bottom-1 -right-1',
      editIcon: 'h-4 w-4'
    },
    large: {
      container: 'w-24 h-24',
      icon: 'h-8 w-8',
      editButton: 'w-10 h-10 -bottom-2 -right-2',
      editIcon: 'h-5 w-5'
    },
    xlarge: {
      container: 'w-32 h-32',
      icon: 'h-12 w-12',
      editButton: 'w-12 h-12 -bottom-2 -right-2',
      editIcon: 'h-6 w-6'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  useEffect(() => {
    if (user?.accountid) {
      
      const timestamp = Date.now();
      setImageUrl(`/user/profilePicture/${user.accountid}?t=${timestamp}`);
      setImageError(false);
    }
  }, [user?.accountid, refreshTrigger]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className="relative inline-block">
      <div className={`${config.container} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center`}>
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <User className={`${config.icon} text-gray-400`} />
        )}
      </div>
      
      {showEditButton && onEditClick && (
        <button
          onClick={onEditClick}
          className={`absolute ${config.editButton} bg-blue-600 hover:bg-blue-700 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors group`}
          title="Change profile picture"
        >
          <Camera className={`${config.editIcon} text-white group-hover:scale-110 transition-transform`} />
        </button>
      )}
    </div>
  );
};

export default ProfilePictureDisplay;
