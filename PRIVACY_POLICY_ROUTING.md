# Privacy Policy & First-Time User Routing

## Overview

The app now intelligently routes first-time users to the registration page and returning users to the login page based on privacy policy acceptance status.

## Routing Logic

### User Flow Diagram

```
App Launch
    ↓
Check Authentication Status
    ↓
Check Privacy Policy Acceptance
    ├─ If NOT Accepted (First-time user)
    │   ↓
    │   Redirect to Register Page
    │   ↓
    │   Show Privacy Policy Modal
    │   ↓
    │   User Reads & Accepts Policy
    │   ↓
    │   Register Account
    │
    ├─ If Accepted (Returning user)
    │   ↓
    │   Redirect to Login Page
    │   ↓
    │   User Logs In
    │
    └─ If Already Authenticated
        ↓
        Redirect to Main App
```

## Implementation Details

### Modified Files

1. **app/_layout.tsx** (Root Layout)
   - Added `usePrivacyPolicyAgreement` hook
   - Modified authentication check to wait for privacy policy status
   - Updated redirect logic based on privacy policy acceptance:
     - `privacyPolicyAccepted === false` → Redirect to `/(auth)/register`
     - `privacyPolicyAccepted === true` → Redirect to `/(auth)/login`
     - If user is already logged in → Stay in main app

### Authentication Wrapper (`AuthWrapper`)

The `AuthWrapper` component in `app/_layout.tsx` now:

1. **Loads Privacy Policy Status**
   ```typescript
   const { hasAccepted: privacyPolicyAccepted, isLoading: privacyPolicyLoading } 
     = usePrivacyPolicyAgreement();
   ```

2. **Waits for Privacy Policy Check**
   - Ensures the privacy policy acceptance status is loaded before making routing decisions
   - Shows a loading spinner while checking

3. **Routes Based on Multiple Conditions**
   - **User is logged in** → Show main app (no redirect)
   - **User is NOT logged in AND privacy policy NOT accepted** → Register page
   - **User is NOT logged in AND privacy policy IS accepted** → Login page

## Key Components

### Privacy Policy Acceptance Storage
- **Storage**: AsyncStorage (device-local)
- **Key**: `privacy_policy_accepted_v1`
- **Value**: `'true'` (string)
- **Scope**: Persists across app sessions

### State Management

The routing system checks multiple states:
1. `isLoading` - Authentication loading state
2. `hasChecked` - Authentication check completion
3. `privacyPolicyLoading` - Privacy policy check completion
4. `privacyPolicyAccepted` - Privacy policy acceptance status
5. `user` - Current logged-in user
6. `token` - Authentication token

## Behavior Examples

### Scenario 1: Completely New User
1. Opens app for the first time
2. Privacy policy not found in AsyncStorage
3. Redirected to register page
4. Privacy policy modal appears automatically
5. User reads and accepts privacy policy
6. User fills registration form and creates account
7. After successful registration, user logs in automatically

### Scenario 2: Returning User
1. Opens app with existing account
2. Privacy policy already accepted
3. Redirected to login page
4. User logs in with credentials
5. After successful login, redirected to main app

### Scenario 3: User Already Logged In
1. Opens app with active session
2. Auth token still valid
3. Skips both register and login pages
4. Directly redirected to main app

## Debugging

To reset the app to first-time state (useful for testing):

```javascript
// Clear auth state and privacy policy
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reset privacy policy acceptance
await AsyncStorage.removeItem('privacy_policy_accepted_v1');

// This will trigger a redirect to the register page on next app launch
```

## Development Notes

### Debouncing
The system includes a 5-second debounce to prevent excessive redirect attempts and multiple route changes.

### Delay on Redirect
There's a 3-second delay before redirect to allow time for state restoration from AsyncStorage.

### Logging
Console logs are available for debugging:
- `[AuthWrapper]` prefix for all auth-related logs
- Logs include state information at each step

## Future Enhancements

1. **Skip Privacy Policy Modal on Login Page**
   - The modal currently only appears on register page
   - Consider showing it on login page for returning users with updated policies

2. **Policy Version Management**
   - Update key from `privacy_policy_accepted_v1` to `privacy_policy_accepted_v2` if policy changes
   - Force users to re-accept new policies

3. **Analytics**
   - Track first-time vs returning user metrics
   - Monitor privacy policy acceptance rates

4. **Onboarding Flow**
   - Add tutorial/onboarding screens after registration
   - Customize experience based on user type

