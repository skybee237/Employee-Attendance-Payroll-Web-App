# TODO: Implement User Password Edit Functionality

## Backend Changes
- [x] Update `realize-backend/controllers/passwordController.js` to implement `changePassword` function
  - Accept currentPassword, newPassword, confirmPassword
  - Verify current password matches user's password
  - Validate new password using passwordValidator
  - Hash new password and update employee record
  - Return appropriate success/error responses

## Frontend Changes
- [x] Update `realize-frontend/src/pages/Profile.jsx` to add change password UI
  - Remove admin-only restriction for Change Password button
  - Add modal/form for password change inputs (current, new, confirm)
  - Add client-side validation
  - Implement API call to /api/password/change
  - Handle success/error responses with toast notifications

## Testing
- [x] Backend and frontend implementation completed - basic syntax verified
- [ ] Full testing deferred per user preference

# New Task: Implement Two-Factor Authentication and Notification Preferences

## Two-Factor Authentication (2FA)
- [x] Install 2FA library (speakeasy) in backend
- [x] Update Employee model to store 2FA secret
- [x] Backend: Add endpoints for 2FA setup, verification, disable
- [x] Update login/auth flow to require 2FA if enabled
- [x] Frontend: Add 2FA setup modal with QR code and verification
- [x] Update Profile.jsx Enable 2FA button functionality

## Notification Preferences
- [x] Design notification preferences structure (email, in-app, etc.)
- [x] Backend: Add notification preferences to Employee model or separate model
- [x] Backend: Add endpoints to get/set notification preferences
- [x] Frontend: Add notification preferences modal with toggles
- [x] Update Profile.jsx Manage button functionality
