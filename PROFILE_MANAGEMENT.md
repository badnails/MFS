# Profile Management System

This document outlines the new profile management system that has been implemented for the MFS (Mobile Financial Services) application.

## New Components

### 1. Profile Dashboard (`/profile`)
- **Component**: `PersonalDashboardProfile.jsx`
- **Description**: A comprehensive overview of user profile with quick edit links
- **Features**:
  - Account overview with status display
  - Personal/Business information summary
  - Contact information summary
  - Security settings with TOTP recovery access
  - Quick navigation to specific edit pages

### 2. Contact Information Update (`/profile/contact-info`)
- **Component**: `ContactInfoUpdate.jsx`
- **Description**: Dedicated page for updating contact information
- **Features**:
  - Email validation with availability checking
  - Phone number validation with availability checking
  - Complete address management
  - Real-time validation feedback
  - Country selection dropdown

### 3. Personal Information Update (`/profile/personal-info`)
- **Component**: `PersonalInfoUpdate.jsx`
- **Description**: Page for updating personal details (for PERSONAL and AGENT accounts)
- **Features**:
  - First and last name editing
  - Date of birth management with validation
  - Gender selection
  - Nationality input
  - Age validation (minimum 13 years)

### 4. Business Information Update (`/profile/institutional-info`)
- **Component**: `InstitutionalInfoUpdate.jsx`
- **Description**: Page for updating business details (for MERCHANT and BILLER accounts)
- **Features**:
  - Business/merchant name editing
  - Website URL with validation
  - Business category selection
  - Context-sensitive labels based on account type

### 5. TOTP Recovery (`/profile/totp-recovery`)
- **Component**: `TOTPRecovery.jsx`
- **Description**: Secure TOTP regeneration for lost authenticator access
- **Features**:
  - Security warnings and confirmations
  - New QR code generation
  - Manual secret key display with copy functionality
  - QR code download option
  - Setup instructions

### 6. Account Details (`/account-details`)
- **Component**: `accountDetails.jsx`
- **Description**: Read-only comprehensive view of all account information
- **Features**:
  - Complete account information display
  - Status indicators
  - Quick link to profile editing
  - Organized layout with icons

## Backend Enhancements

### New Endpoint
- **Route**: `POST /auth/regenerate-totp`
- **Controller**: `regenerateTOTP` in `authController.js`
- **Purpose**: Safely regenerate TOTP secret and return new QR code
- **Security**: Requires valid JWT authentication

## Navigation Integration

### DashboardLayout Updates
- Added dropdown menu to profile icon
- Includes all profile management options
- Click-outside functionality to close dropdown
- Maintains legacy profile component access
- Account type-aware navigation (shows appropriate options for individual vs institutional accounts)

### Routing
All new routes are protected and require authentication:
- `/profile` - Main profile dashboard
- `/account-details` - Read-only account view
- `/profile/contact-info` - Contact information editing
- `/profile/personal-info` - Personal information editing (individual accounts)
- `/profile/institutional-info` - Business information editing (business accounts)
- `/profile/totp-recovery` - TOTP recovery and regeneration

## Security Features

1. **JWT Authentication**: All profile endpoints require valid JWT token
2. **Data Validation**: Client-side and server-side validation for all inputs
3. **Email/Phone Uniqueness**: Real-time checking to prevent duplicates
4. **TOTP Security**: Confirmation dialogs and warnings for TOTP regeneration
5. **Account Type Validation**: Routes show appropriate forms based on account type

## User Experience Features

1. **Responsive Design**: All components work on mobile and desktop
2. **Loading States**: Proper loading indicators during API calls
3. **Error Handling**: User-friendly error messages with retry options
4. **Success Feedback**: Clear success messages with auto-navigation
5. **Form Validation**: Real-time validation with visual feedback
6. **Accessibility**: Proper labeling and keyboard navigation support

## Technical Implementation

### State Management
- React hooks for local state management
- Debounced API calls for validation
- Proper cleanup and error boundaries

### API Integration
- Consistent error handling across all components
- Proper HTTP status code handling
- Token-based authentication for all requests

### Code Organization
- Modular component structure
- Reusable validation utilities
- Consistent styling with Tailwind CSS
- Proper separation of concerns

## Future Enhancements

1. **Profile Picture Upload**: Add avatar/logo upload functionality
2. **Two-Factor Backup Codes**: Generate and manage backup codes
3. **Activity Log**: Show profile change history
4. **Advanced Validation**: Add more sophisticated business rules
5. **Bulk Updates**: Allow updating multiple sections at once
6. **Export Profile**: PDF/JSON export of profile data

## Usage Instructions

### For End Users
1. Click on the profile dropdown in the header
2. Select the appropriate option for what you want to update
3. Make your changes and save
4. Use the TOTP recovery only if you've lost access to your authenticator

### For Developers
1. All components follow the same pattern for consistency
2. API calls use the existing authentication system
3. Validation follows established patterns
4. Error handling is consistent across components
5. Components are fully self-contained and reusable

## Testing Recommendations

1. **Authentication Testing**: Verify all routes require proper authentication
2. **Validation Testing**: Test all form validations thoroughly
3. **Error Handling**: Test network failures and server errors
4. **TOTP Testing**: Verify TOTP regeneration works with authenticator apps
5. **Cross-browser Testing**: Ensure compatibility across browsers
6. **Mobile Testing**: Verify responsive design on various devices
