// src/components/profile/TOTPRecovery.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Key, 
  Download, 
  Copy, 
  ArrowLeft, 
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react';

const TOTPRecovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateNewTOTP = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:3000/auth/regenerate-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountid: user.accountid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate new TOTP');
      }

      const data = await response.json();
      setQrCode(data.qrURI);
      setSecretKey(data.totpkey);
      setSuccess('New TOTP code generated successfully!');
      setShowConfirmation(false);
    } catch (err) {
      setError('Failed to generate new TOTP code');
      console.error('TOTP generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy secret:', err);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `totp-qr-${user.username}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Key className="h-6 w-6 text-orange-600" />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                TOTP Recovery
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Generate a new TOTP QR code for your authenticator app
              </p>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Security Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Generating a new TOTP will invalidate your current authenticator setup</li>
                    <li>You will need to reconfigure your authenticator app with the new QR code</li>
                    <li>Save the backup codes in a secure location</li>
                    <li>Only do this if you've lost access to your authenticator app</li>
                  </ul>
                </div>
              </div>
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

          {!qrCode && !showConfirmation && (
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Generate New TOTP?
              </h3>
              <p className="text-gray-600 mb-6">
                Click the button below to generate a new TOTP QR code. This will replace your current setup.
              </p>
              <button
                onClick={() => setShowConfirmation(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <Key className="-ml-1 mr-2 h-5 w-5" />
                Generate New TOTP
              </button>
            </div>
          )}

          {showConfirmation && !qrCode && (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Are you sure?
              </h3>
              <p className="text-gray-600 mb-6">
                This will invalidate your current TOTP setup. You'll need to reconfigure your authenticator app.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateNewTOTP}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    'Yes, Generate New TOTP'
                  )}
                </button>
              </div>
            </div>
          )}

          {qrCode && (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Scan QR Code with Your Authenticator App
                </h3>
                <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                  <img 
                    src={qrCode} 
                    alt="TOTP QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <button
                  onClick={downloadQR}
                  className="mt-3 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download QR Code
                </button>
              </div>

              {/* Manual Entry */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Manual Entry (if QR code doesn't work)
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Enter this secret key manually in your authenticator app:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono">
                    {secretKey}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Setup Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Setup Instructions
                </h4>
                <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Add a new account by scanning the QR code or entering the secret key</li>
                  <li>Enter "MFS - {user?.username}" as the account name</li>
                  <li>Save the setup and test generating a code</li>
                  <li>Store this QR code or secret key in a secure location for backup</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setQrCode('');
                    setSecretKey('');
                    setSuccess('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TOTPRecovery;
