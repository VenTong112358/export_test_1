# Latest Updates: Default Register Page & Decline Button

## Changes Summary

### 1. **Register Page as Default First Screen**

#### Modified: `app/(auth)/_layout.tsx`
- **Changed**: Reordered Stack.Screen declarations
- **Before**: `login` was first in the stack
- **After**: `register` is now first in the stack
- **Result**: Users see the register page immediately on first app load

#### Modified: `app/_layout.tsx`
- **Changed**: Simplified redirect logic to always send unauthenticated users to register
- **Before**: Checked privacy policy status to decide between register/login
- **After**: All unauthenticated users go directly to `/(auth)/register`
- **Result**: Register page is the true entry point of the app

### 2. **Added "我拒绝" (Decline) Button to Privacy Policy Modal**

#### Modified: `app/components/PrivacyPolicyModal.tsx`

**Interface Changes:**
```typescript
interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;  // NEW
}
```

**UI Changes:**
- Two buttons displayed side-by-side in a row layout:
  - **Left**: "我拒绝" (Decline) - Outlined button with gray border
  - **Right**: "我同意" (Agree) - Orange filled button

**Button Styling:**
- **Decline Button**: 
  - Outlined style with gray border (#838589)
  - Gray text
  - Takes up 50% of button container width

- **Agree Button**:
  - Orange filled (#FC9B33)
  - White text
  - Takes up 50% of button container width
  - Shadow effect

**New Styles Added:**
```typescript
buttonRow: {
  flexDirection: 'row',
  gap: 12,
},
declineButton: {
  borderColor: '#838589',
  borderWidth: 1,
  borderRadius: 12,
},
declineButtonLabel: {
  color: '#838589',
  fontSize: 16,
  fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  fontWeight: '700',
},
```

#### Modified: `app/(auth)/register.tsx`

**New Handler:**
```typescript
const handleDeclinePrivacyPolicy = () => {
  // User declined - prevent access to the app
  setFormError('您必须同意隐私政策才能使用本应用');
  setShowPrivacyModal(false);
};
```

**Modal Component Update:**
```typescript
<PrivacyPolicyModal 
  visible={showPrivacyModal} 
  onAccept={handleAcceptPrivacyPolicy}
  onDecline={handleDeclinePrivacyPolicy}
/>
```

## User Flow

```
App Launch
  ↓
Loading Screen (3 seconds)
  ↓
Register Page (with Privacy Policy Modal)
  ↓
Privacy Policy Modal appears
  ├─ User clicks "阅读隐私政策" → Opens full policy in browser
  ├─ User clicks "我同意" → Accepts, modal closes, can register
  └─ User clicks "我拒绝" → Shows error message "您必须同意隐私政策才能使用本应用"
  ↓
User completes registration or declines
```

## Behavior Examples

### Scenario 1: First-time User
1. Opens app for the first time
2. Sees loading screen for 3 seconds
3. Lands on register page
4. Privacy policy modal appears automatically
5. Two options:
   - Click "我同意" → Proceeds with registration
   - Click "我拒绝" → Shows error, remains on register page

### Scenario 2: User Declines Policy
1. Sees error message: "您必须同意隐私政策才能使用本应用"
2. Can close modal and try again
3. Cannot access app until privacy policy is accepted

### Scenario 3: User Agrees to Policy
1. Privacy policy modal closes
2. Can now proceed with registration
3. Fills form and completes registration process

## No More Waiting for First Click

- **Previously**: Users had to click on login to see the register routing
- **Now**: Register page appears immediately as the default auth screen
- **Result**: Faster user experience for new users

## Style Consistency

The new decline button follows the app's design system:
- Uses the same gray color (#838589) found in labels and secondary text
- Maintains consistent border radius (12px) with other buttons
- Proper spacing and padding consistent with the app's spacing scale
- Responsive sizing based on screen dimensions

## Testing Checklist

- [ ] App launches and shows register page by default
- [ ] Privacy policy modal appears automatically
- [ ] "我同意" button accepts and allows registration
- [ ] "我拒绝" button shows error message
- [ ] "阅读隐私政策" link opens browser with correct URL
- [ ] Modal closes after accepting
- [ ] Error message displays after declining
- [ ] Both buttons are equal width and properly spaced
- [ ] Buttons are responsive on different screen sizes

