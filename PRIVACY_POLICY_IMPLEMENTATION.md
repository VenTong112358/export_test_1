# Privacy Policy Implementation Guide

## Overview

This implementation adds a privacy policy agreement modal that appears on the register page when a user opens the app for the first time. Users must agree to the privacy policy before they can use the app normally and proceed with registration.

## Components Added

### 1. **PrivacyPolicyModal.tsx**
Location: `app/components/PrivacyPolicyModal.tsx`

A reusable modal component that displays:
- A privacy policy header
- Informational content about privacy protection
- A clickable link "阅读隐私政策" that opens the full privacy policy at: https://masterwordai.com/%E5%85%B3%E4%BA%8E%E5%85%AC%E5%8F%B8-2
- An "我同意隐私政策" (I Agree to Privacy Policy) button to proceed

**Props:**
- `visible` (boolean): Controls whether the modal is displayed
- `onAccept` (function): Callback when user clicks the agree button

### 2. **usePrivacyPolicyAgreement.ts Hook**
Location: `hooks/usePrivacyPolicyAgreement.ts`

A custom React hook that manages the privacy policy agreement state:

**Features:**
- Stores privacy policy acceptance status in AsyncStorage using the key `privacy_policy_accepted_v1`
- Provides methods:
  - `acceptPrivacyPolicy()`: Mark the policy as accepted
  - `resetPrivacyPolicyStatus()`: Reset the status (useful for testing)
- Returns:
  - `hasAccepted`: Current acceptance status (true/false/null during loading)
  - `isLoading`: Loading state while checking the stored value
  - `acceptPrivacyPolicy`: Function to accept the policy
  - `resetPrivacyPolicyStatus`: Function to reset the status

### 3. **Updated register.tsx**
Location: `app/(auth)/register.tsx`

**Changes made:**
- Added imports for `PrivacyPolicyModal` and `usePrivacyPolicyAgreement` hook
- Added state for `showPrivacyModal`
- Integrated the privacy policy hook to check if user has accepted on first visit
- Added `useEffect` to display modal on first app launch if policy hasn't been accepted
- Added `handleAcceptPrivacyPolicy` function to save acceptance status
- Wrapped the component's JSX in a Fragment to include both the modal and the form

## How It Works

1. **First App Launch**: 
   - When a user lands on the register page for the first time, the `usePrivacyPolicyAgreement` hook checks AsyncStorage
   - If no acceptance record is found, `showPrivacyModal` is set to true
   - The privacy policy modal appears as an overlay

2. **User Interaction**:
   - User can click "阅读隐私政策" to open the full privacy policy in their browser
   - User clicks "我同意隐私政策" to accept and proceed
   - The acceptance status is saved to AsyncStorage

3. **Subsequent Visits**:
   - The modal no longer appears because the acceptance status is already stored
   - Users can continue with normal registration flow

4. **User Registration Flow**:
   - After accepting the privacy policy, users fill in their registration details
   - The existing terms acceptance checkbox (in the form) is still required
   - Users can proceed with SMS verification and registration as normal

## Storage

Privacy policy acceptance is stored in **AsyncStorage** with:
- **Key**: `privacy_policy_accepted_v1`
- **Value**: `'true'` (string)
- **Scope**: Device-local storage that persists across app sessions

## Styling

The modal uses the app's existing design system:
- Background color: `#FFFBF8` (matching the app theme)
- Button color: `#FC9B33` (orange accent used throughout the app)
- Text colors aligned with the app's color scheme
- Responsive sizing using Dimensions for width/height calculations
- Responsive padding and margins based on screen dimensions

## Testing

To test the privacy policy modal:

1. **Clear AsyncStorage** to reset the acceptance status:
   ```javascript
   // In a debug component or console:
   import AsyncStorage from '@react-native-async-storage/async-storage';
   AsyncStorage.removeItem('privacy_policy_accepted_v1');
   ```

2. **Restart the app** and navigate to the register page
3. **The modal should appear** on initial load
4. **Click the agreement button** to accept and proceed
5. **Reload the app** and verify the modal no longer appears

## User Flow Diagram

```
User Opens App
    ↓
Navigate to Register Page
    ↓
Check AsyncStorage for Privacy Policy Acceptance
    ↓
Not Found? → Show Privacy Policy Modal
    ↓
User Clicks Link (Optional) → Opens Privacy Policy Website
    ↓
User Clicks "I Agree" Button
    ↓
Save Acceptance to AsyncStorage
    ↓
Hide Modal → Show Registration Form
    ↓
User Completes Registration
```

## Future Enhancements

- **Policy Version Management**: Update `privacy_policy_accepted_v1` to `privacy_policy_accepted_v2` if policy changes
- **Show Modal on Login**: Optionally show the modal on the login page as well
- **Admin Control**: Add a flag to force users to re-accept updated privacy policies
- **Analytics**: Track acceptance metrics and timestamps

