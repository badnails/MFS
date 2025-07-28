// GeneralPopup Component Usage Examples

import GeneralPopup from '../components/common/GeneralPopup';

// 1. FAILURE MODE (like payment authentication failure)
<GeneralPopup
  isVisible={showFailurePopup}
  mode="failure"
  title="Transaction Failed"
  subtitle="Authentication unsuccessful"
  message="Your payment could not be processed due to multiple failed authentication attempts."
  redirectTo="/dashboard"
  preventBack={true}          // Prevents back navigation to failed transaction
  countdownSeconds={3}
  autoRedirect={true}
  onClose={() => setShowFailurePopup(false)}
/>

// 2. SUCCESS MODE (like successful payment)
<GeneralPopup
  isVisible={showSuccessPopup}
  mode="success"
  title="Payment Successful"
  subtitle="Transaction completed"
  message="Your payment has been processed successfully."
  redirectTo="/dashboard"
  countdownSeconds={2}
  autoRedirect={true}
  primaryButtonText="View Receipt"
  onClose={() => setShowSuccessPopup(false)}
/>

// 3. WARNING MODE (like session expiry warning)
<GeneralPopup
  isVisible={showWarningPopup}
  mode="warning"
  title="Session Expiring"
  subtitle="Please save your work"
  message="Your session will expire in 2 minutes. Please save any unsaved changes."
  redirectTo="/login"
  countdownSeconds={120}      // 2 minutes
  autoRedirect={true}
  primaryButtonText="Extend Session"
  onClose={() => setShowWarningPopup(false)}
/>

// 4. INFO MODE (like maintenance notice)
<GeneralPopup
  isVisible={showInfoPopup}
  mode="info"
  title="Maintenance Notice"
  subtitle="Scheduled downtime"
  message="The system will be under maintenance from 2:00 AM to 4:00 AM."
  autoRedirect={false}        // No auto redirect
  primaryButtonText="Acknowledge"
  onClose={() => setShowInfoPopup(false)}
/>

// 5. CHOICE MODE (like confirmation dialog)
<GeneralPopup
  isVisible={showChoicePopup}
  mode="choice"
  title="Delete Account"
  subtitle="This action cannot be undone"
  message="Are you sure you want to permanently delete your account? All data will be lost."
  primaryButtonText="Delete Account"
  secondaryButtonText="Cancel"
  onPrimaryAction={() => {
    // Handle delete action
    handleDeleteAccount();
    setShowChoicePopup(false);
  }}
  onSecondaryAction={() => {
    // Handle cancel action
    setShowChoicePopup(false);
  }}
  onClose={() => setShowChoicePopup(false)}
/>

// 6. CUSTOM STYLED MODE
<GeneralPopup
  isVisible={showCustomPopup}
  mode="success"
  title="Custom Styled Success"
  customColors={{
    gradient: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-400 to-purple-500",
    button: "bg-purple-600 hover:bg-purple-700",
    progress: "#a855f7"
  }}
  customIcon={Star}  // Import { Star } from 'lucide-react'
  message="You've earned a special achievement!"
  onClose={() => setShowCustomPopup(false)}
/>

/* 
PROPS REFERENCE:

REQUIRED:
- isVisible: boolean

MODES:
- mode: "failure" | "success" | "warning" | "info" | "choice"

CONTENT:
- title: string (optional, has defaults per mode)
- subtitle: string (optional, has defaults per mode) 
- message: string (optional, has defaults per mode)

TIMER (for non-choice modes):
- countdownSeconds: number (default: 3)
- autoRedirect: boolean (default: true)
- redirectTo: string (default: "/dashboard")
- preventBack: boolean (default: false) - uses replace instead of push

BUTTONS:
- primaryButtonText: string (optional, has defaults per mode)
- secondaryButtonText: string (choice mode only)

ACTIONS:
- onClose: function
- onPrimaryAction: function (choice mode)
- onSecondaryAction: function (choice mode)

CUSTOMIZATION:
- customIcon: React Component (from lucide-react)
- customColors: object with gradient, bgGradient, button, progress properties
*/
