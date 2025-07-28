// src/components/common/TransactionFailurePopup.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, X } from 'lucide-react';

const TransactionFailurePopup = ({ 
  isVisible, 
  onClose, 
  title = "Transaction Failed", 
  subtitle = "Authentication unsuccessful",
  message = "Your payment could not be processed due to multiple failed authentication attempts.",
  redirectTo = "/dashboard",
  countdownSeconds = 3,
  buttonText = "Go to Dashboard Now"
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(countdownSeconds);

  useEffect(() => {
    if (!isVisible) return;

    setCountdown(countdownSeconds);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleNavigation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isVisible, countdownSeconds]);

  const handleNavigation = () => {
    navigate(redirectTo);
    if (onClose) onClose();
  };

  const handleClose = () => {
    if (onClose) onClose();
    navigate(redirectTo);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Transaction Failure Popup */}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-50 animate-pulse"></div>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <XCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-red-100 text-sm mt-1">{subtitle}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <p className="text-gray-700 mb-4">{message}</p>
            
            {/* Countdown Circle */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray={`${(countdownSeconds - countdown + 1) * (100/countdownSeconds)}, 100`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-600">{countdown}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>

            <button
              onClick={handleNavigation}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0px); 
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default TransactionFailurePopup;
