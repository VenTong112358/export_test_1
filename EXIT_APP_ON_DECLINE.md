# Update: Exit App on Privacy Policy Decline

## Change Summary

When a user clicks the "我拒绝" (Decline) button on the privacy policy modal, the app now exits immediately instead of showing an error message.

## Modified File

### `app/(auth)/register.tsx`

**Changes:**
1. Added `BackHandler` import from React Native
2. Updated `handleDeclinePrivacyPolicy` function to call `BackHandler.exitApp()`

**Before:**
```typescript
const handleDeclinePrivacyPolicy = () => {
  // User declined - prevent access to the app
  setFormError('您必须同意隐私政策才能使用本应用');
  setShowPrivacyModal(false);
};
```

**After:**
```typescript
const handleDeclinePrivacyPolicy = () => {
  // User declined - exit the app
  console.log('[Register] User declined privacy policy, exiting app');
  BackHandler.exitApp();
};
```

## User Experience

### New Flow

```
App Launch
  ↓
Register Page (with Privacy Policy Modal)
  ↓
Privacy Policy Modal appears
  ├─ User clicks "阅读隐私政策" → Opens full policy in browser
  ├─ User clicks "我同意" → Accepts, proceeds with registration
  └─ User clicks "我拒绝" → App exits immediately
```

### Previous Flow

```
App Launch
  ↓
Register Page (with Privacy Policy Modal)
  ↓
Privacy Policy Modal appears
  ├─ User clicks "阅读隐私政策" → Opens full policy in browser
  ├─ User clicks "我同意" → Accepts, proceeds with registration
  └─ User clicks "我拒绝" → Shows error message, stays on page
```

## Technical Details

### BackHandler.exitApp()

- **Platform**: Cross-platform (iOS and Android)
- **Behavior**: 
  - On Android: Closes the app and removes it from recent apps
  - On iOS: Closes the app
- **Logging**: Console logs `[Register] User declined privacy policy, exiting app`

### Import Statement

```typescript
import { BackHandler, Dimensions, Linking, ... } from 'react-native';
```

The `BackHandler` is a React Native API that allows control of the Android back button behavior. `exitApp()` is a method that terminates the application.

## No Additional Dependencies

- No new npm packages required
- Uses native React Native API (`BackHandler`)
- Compatible with both iOS and Android platforms

## Testing

To test this feature:

1. Launch the app
2. Privacy policy modal appears automatically on register page
3. Click the "我拒绝" button
4. App should close/exit immediately
5. App will no longer be running

## Related Documentation

- [React Native BackHandler Documentation](https://reactnative.dev/docs/backhandler)
- The privacy policy acceptance status is still tracked in AsyncStorage
- If user re-opens the app, the modal will appear again

