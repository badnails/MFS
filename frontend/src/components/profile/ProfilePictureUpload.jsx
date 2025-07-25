// src/components/profile/ProfilePictureUpload.jsx
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Upload, 
  Camera, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  User,
  Trash2
} from 'lucide-react';

const ProfilePictureUpload = ({ 
  currentPicture, 
  onUploadSuccess, 
  onDeleteSuccess,
  isOpen, 
  onClose 
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setSelectedFile(file);
    setError('');
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);
      formData.append('accountid', user.accountid);
      
      const response = await fetch('/user/uploadProfilePicture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload profile picture';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response doesn't contain valid JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      setSuccess('Profile picture uploaded successfully!');
      
      // Clean up
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPicture) return;
    
    setDeleting(true);
    setError('');
    
    try {
      const response = await fetch('/user/deleteProfilePicture', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountid: user.accountid
        })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete profile picture';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response doesn't contain valid JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      setSuccess('Profile picture deleted successfully!');
      
      // Notify parent component
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError('');
    setSuccess('');
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Profile Picture
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <Check className="h-4 w-4 text-green-400 mt-0.5 mr-2" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        )}

        {/* Current Picture Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Picture
          </label>
          <div className="flex items-center justify-center">
            {currentPicture ? (
              <div className="relative">
                <img
                  src={`http://localhost:3000/user/profilePicture/${user.accountid}`}
                  alt="Current profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center" style={{display: 'none'}}>
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload New Picture
          </label>
          
          {/* Preview */}
          {previewUrl && (
            <div className="mb-4 flex justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-300"
              />
            </div>
          )}
          
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Upload Button */}
          <button
            type="button"
            onClick={triggerFileInput}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Camera className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              Choose image file
            </span>
          </button>
          
          <p className="mt-2 text-xs text-gray-500">
            Supported formats: JPG, PNG, GIF. Max size: 5MB
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="-ml-1 mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          )}
          
          {currentPicture && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="-ml-1 mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
