// src/components/personal/MerchantPayment.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Store, QrCode, Scan, Camera, StopCircle } from 'lucide-react';
import AccountSearch from '../common/AccountSearch';
import axios from 'axios';
import QrScanner from 'qr-scanner';

const MerchantPayment = ({ onClose }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [description, setDescription] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);
  const [scanError, setScanError] = useState('');
  const [mediaStream, setMediaStream] = useState(null);

  const processQRResult = useCallback(async (qrText) => {
    setIsLoadingTransaction(true);
    try {
      // Try to parse as QR data JSON
      const qrData = JSON.parse(qrText);
      if (qrData.transactionId) {
        // This is QR code data - navigate to payment with just the transaction ID
        navigate('/payment', {
          state: {
            transactionId: qrData.transactionId
          }
        });
        return;
      }
    } catch {
      // Not JSON, might be just a transaction ID
      try {
        // Fetch transaction details from backend
        const response = await axios.get(`/transaction/details/${qrText}`);
        
        if (response.data.valid && response.data.transactionDetails) {
          // Navigate to payment with just the transaction ID
          navigate('/payment', {
            state: {
              transactionId: qrText
            }
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error);
      }
    }
    
    // If we get here, the QR code wasn't valid
    setScanError('Invalid QR code. Please scan a valid transaction QR code.');
    setIsLoadingTransaction(false);
  }, [navigate]);

  const stopQRScanning = useCallback(() => {
    console.log('stopQRScanning called');
    
    // Stop and destroy the QR scanner
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
    }
    
    // Stop the media stream to turn off camera
    if (mediaStream) {
      console.log('Stopping media stream tracks...');
      mediaStream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setMediaStream(null);
    }
    
    setIsScanning(false);
    setScanError('');
  }, [qrScanner, mediaStream]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up camera...');
      if (qrScanner) {
        qrScanner.destroy();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          console.log('Cleanup - stopping track:', track.kind);
          track.stop();
        });
      }
    };
  }, [qrScanner, mediaStream]);

  const startQRScanning = async () => {
    console.log('startQRScanning called');
    try {
      setScanError('');
      setIsScanning(true);
      
      // Check camera availability first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }
      
      console.log('Requesting camera permission...');
      // Request camera permission and store the media stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Camera permission granted');
      setMediaStream(stream);
      
      // Always create a new scanner since destroyed scanners can't be restarted
      if (videoRef.current) {
        console.log('Creating new QR scanner...');
        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR code detected:', result.data);
            processQRResult(result.data);
            stopQRScanning();
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera on mobile
          }
        );
        setQrScanner(scanner);
        
        console.log('Starting scanner...');
        // Start the scanner
        await scanner.start();
        console.log('Scanner started successfully');
      }
      
    } catch (err) {
      console.error('QR scanning error:', err);
      let errorMessage = 'Failed to access camera or scan QR code.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please check your camera connection.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera access is not supported in this browser.';
      }
      
      setScanError(errorMessage);
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    // Stop camera before closing
    stopQRScanning();
    onClose();
  };

  const handleMerchantSelect = (merchant) => {
    setSelectedMerchant(merchant);
  };

  const handleQRScan = async () => {
    if (!transactionId.trim()) return;
    
    setIsLoadingTransaction(true);
    try {
      // First try to parse as QR data JSON
      try {
        const qrData = JSON.parse(transactionId);
        if (qrData.transactionId) {
          // This is QR code data - navigate with just the transaction ID
          navigate('/payment', {
            state: {
              transactionId: qrData.transactionId
            }
          });
          return;
        }
      } catch {
        // Not JSON, treat as transaction ID
      }

      // Fetch transaction details from backend to validate
      const response = await axios.get(`/transaction/details/${transactionId}`);
      
      if (response.data.valid && response.data.transactionDetails) {
        // Navigate to payment with just the transaction ID
        navigate('/payment', {
          state: {
            transactionId: transactionId
          }
        });
      } else {
        throw new Error(response.data.message || 'Transaction not found');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert('Failed to load transaction details. Please check the transaction ID or QR code data.');
    } finally {
      setIsLoadingTransaction(false);
    }
  };

  const handleContinue = () => {
    if (!selectedMerchant) {
      return;
    }

    navigate('/payment', {
      state: {
        recipientId: selectedMerchant.accountid,
        recipientName: selectedMerchant.accountname,
        paymentType: 'merchant-payment',
        description: description || 'Merchant payment'
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Store className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Merchant Payment</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <AccountSearch
            accountType="MERCHANT"
            onSelectAccount={handleMerchantSelect}
            placeholder="Search for merchants..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="What are you paying for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Scan Transaction QR Code</p>
              <p className="text-xs text-gray-500">Use your camera to scan merchant QR codes</p>
            </div>
            
            {!isScanning ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    console.log('Start Camera Scanner button clicked');
                    startQRScanning();
                  }}
                  disabled={isLoadingTransaction}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>{isLoadingTransaction ? 'Processing...' : 'Start Camera Scanner'}</span>
                </button>
                
                {/* Manual input fallback */}
                <div className="border-t border-gray-200 pt-3">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                    placeholder="Or enter Transaction ID manually"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <button
                    onClick={handleQRScan}
                    disabled={!transactionId.trim() || isLoadingTransaction}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Scan className="h-4 w-4" />
                    <span>{isLoadingTransaction ? 'Loading...' : 'Load Transaction'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 border-2 border-white rounded-lg"></div>
                    </div>
                  </div>
                  {isLoadingTransaction && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-sm">Processing QR code...</div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={stopQRScanning}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <StopCircle className="h-4 w-4" />
                  <span>Stop Scanner</span>
                </button>
              </div>
            )}
            
            {scanError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{scanError}</p>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedMerchant}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MerchantPayment;