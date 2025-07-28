// src/components/common/GeneralPopup.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const GeneralPopup = ({ 
  isVisible,
  mode = "failure", // "failure", "success", "warning", "info", "choice"
  onClose,
  
  // Content props
  title,
  subtitle,
  message,
  
  // Timer props (for failure/success/warning/info modes)
  countdownSeconds = 3,
  autoRedirect = true,
  redirectTo = "/dashboard",
  preventBack = false, // When true, replaces history instead of pushing
  
  // Button props
  primaryButtonText,
  secondaryButtonText,
  
  // Choice mode props
  onPrimaryAction,
  onSecondaryAction,
  
  // Style customization
  customIcon,
  customColors
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(countdownSeconds);

  // Default configurations based on mode
  const getModeConfig = () => {
    switch (mode) {
      case "failure":
        return {
          icon: customIcon || XCircle,
          colors: customColors || {
            gradient: "from-red-500 to-red-600",
            bgGradient: "from-red-400 to-red-500",
            button: "bg-red-600 hover:bg-red-700",
            progress: "#ef4444"
          },
          title: title || "Transaction Failed",
          subtitle: subtitle || "Authentication unsuccessful",
          message: message || "Your request could not be processed.",
          primaryButtonText: primaryButtonText || "Go to Dashboard Now"
        };
      case "success":
        return {
          icon: customIcon || CheckCircle,
          colors: customColors || {
            gradient: "from-green-500 to-green-600",
            bgGradient: "from-green-400 to-green-500",
            button: "bg-green-600 hover:bg-green-700",
            progress: "#22c55e"
          },
          title: title || "Success",
          subtitle: subtitle || "Operation completed",
          message: message || "Your request has been processed successfully.",
          primaryButtonText: primaryButtonText || "Continue"
        };
      case "warning":
        return {
          icon: customIcon || AlertTriangle,
          colors: customColors || {
            gradient: "from-yellow-500 to-yellow-600",
            bgGradient: "from-yellow-400 to-yellow-500",
            button: "bg-yellow-600 hover:bg-yellow-700",
            progress: "#eab308"
          },
          title: title || "Warning",
          subtitle: subtitle || "Please review",
          message: message || "Please review the information before proceeding.",
          primaryButtonText: primaryButtonText || "Understood"
        };
      case "info":
        return {
          icon: customIcon || Info,
          colors: customColors || {
            gradient: "from-blue-500 to-blue-600",
            bgGradient: "from-blue-400 to-blue-500",
            button: "bg-blue-600 hover:bg-blue-700",
            progress: "#3b82f6"
          },
          title: title || "Information",
          subtitle: subtitle || "Please note",
          message: message || "Important information for your attention.",
          primaryButtonText: primaryButtonText || "Got it"
        };
      case "choice":
        return {
          icon: customIcon || Info,
          colors: customColors || {
            gradient: "from-gray-500 to-gray-600",
            bgGradient: "from-gray-400 to-gray-500",
            button: "bg-blue-600 hover:bg-blue-700",
            secondaryButton: "bg-gray-600 hover:bg-gray-700",
            progress: "#6b7280"
          },
          title: title || "Confirmation",
          subtitle: subtitle || "Please choose",
          message: message || "Please make your selection.",
          primaryButtonText: primaryButtonText || "Accept",
          secondaryButtonText: secondaryButtonText || "Decline"
        };
      default:
        return getModeConfig.call(this, "info");
    }
  };

  const config = getModeConfig();
  const IconComponent = config.icon;

  useEffect(() => {
    if (!isVisible || mode === "choice") return;

    setCountdown(countdownSeconds);
    
    if (!autoRedirect) return;

    // Start countdown for auto-redirect modes
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Handle navigation directly here to avoid dependency issues
          if (preventBack) {
            navigate(redirectTo, { replace: true });
          } else {
            navigate(redirectTo);
          }
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isVisible, countdownSeconds, autoRedirect, mode, navigate, redirectTo, preventBack, onClose]);

  const handleNavigation = () => {
    if (preventBack) {
      navigate(redirectTo, { replace: true });
    } else {
      navigate(redirectTo);
    }
    if (onClose) onClose();
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (redirectTo && mode !== "choice") {
      handleNavigation();
    }
  };

  const handlePrimaryAction = () => {
    if (mode === "choice" && onPrimaryAction) {
      onPrimaryAction();
    } else {
      handleNavigation();
    }
  };

  const handleSecondaryAction = () => {
    if (mode === "choice" && onSecondaryAction) {
      onSecondaryAction();
    } else {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* General Popup */}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform animate-scale-in">
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.colors.gradient} p-6 rounded-t-2xl text-white text-center relative overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${config.colors.bgGradient} opacity-50 animate-pulse`}></div>
            
            {/* Close button - only show for choice mode or when onClose is provided */}
            {(mode === "choice" || onClose) && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                <IconComponent className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{config.title}</h3>
              <p className="text-white/90 text-sm mt-1">{config.subtitle}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <p className="text-gray-700 mb-4">{config.message}</p>
            
            {/* Countdown Circle - only for auto-redirect modes */}
            {mode !== "choice" && autoRedirect && (
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
                    stroke={config.colors.progress}
                    strokeWidth="2"
                    strokeDasharray={`${(countdownSeconds - countdown + 1) * (100/countdownSeconds)}, 100`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: config.colors.progress }}>
                    {countdown}
                  </span>
                </div>
              </div>
            )}

            {/* Countdown text - only for auto-redirect modes */}
            {mode !== "choice" && autoRedirect && (
              <p className="text-sm text-gray-500 mb-4">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            )}

            {/* Action Buttons */}
            <div className={`space-y-3 ${mode === "choice" ? "space-y-3" : ""}`}>
              <button
                onClick={handlePrimaryAction}
                className={`w-full py-2 px-4 text-white rounded-lg transition-colors font-medium ${config.colors.button}`}
              >
                {config.primaryButtonText}
              </button>

              {/* Secondary button for choice mode */}
              {mode === "choice" && (
                <button
                  onClick={handleSecondaryAction}
                  className={`w-full py-2 px-4 text-white rounded-lg transition-colors font-medium ${config.colors.secondaryButton || "bg-gray-600 hover:bg-gray-700"}`}
                >
                  {config.secondaryButtonText}
                </button>
              )}
            </div>
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

export default GeneralPopup;
