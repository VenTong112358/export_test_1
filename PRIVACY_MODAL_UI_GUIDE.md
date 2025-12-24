# Privacy Policy Modal - UI Layout

## Visual Structure

```
┌─────────────────────────────────────────────────┐
│                 隐私政策                          │
├─────────────────────────────────────────────────┤
│                                                   │
│  欢迎使用仝文馆！为了保护您的隐私权和            │
│  个人信息安全，我们制定了隐私政策。              │
│                                                   │
│  使用本应用前，请仔细阅读我们的《隐私政策》，    │
│  了解我们如何收集、使用和保护您的个人信息。      │
│                                                   │
│  点击下方链接可查看完整的隐私政策内容。          │
│                                                   │
├─────────────────────────────────────────────────┤
│              阅读隐私政策                        │
│         (Blue underlined link)                  │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────────┬──────────────────┐        │
│  │     我拒绝       │     我同意        │        │
│  │  (Gray outline)  │ (Orange filled)  │        │
│  └──────────────────┴──────────────────┘        │
│                                                   │
└─────────────────────────────────────────────────┘
```

## Button States

### Decline Button (我拒绝)
- **Style**: Outlined
- **Border Color**: #838589 (Gray)
- **Text Color**: #838589 (Gray)
- **Background**: Transparent
- **Width**: 50% of container (with margin)

### Accept Button (我同意)
- **Style**: Contained (Filled)
- **Background Color**: #FC9B33 (Orange)
- **Text Color**: #FFFFFF (White)
- **Shadow**: Yes
- **Width**: 50% of container (with margin)

## Color Palette

| Component | Color | Hex Code |
|-----------|-------|----------|
| Modal Background | Cream | #FFFBF8 |
| Header Text | Dark Blue | #0C1A30 |
| Body Text | Dark Gray | #333333 |
| Link Text | Blue | #0066CC |
| Decline Button Border | Gray | #838589 |
| Decline Button Text | Gray | #838589 |
| Accept Button | Orange | #FC9B33 |
| Accept Button Text | White | #FFFFFF |
| Shadow Color | Black | #000000 |

## Responsive Dimensions

The modal uses responsive sizing based on screen width and height:

```typescript
// Button dimensions
buttonContent: {
  paddingVertical: height * 0.015,  // 1.5% of screen height
}

// Container dimensions
buttonContainer: {
  paddingHorizontal: width * 0.06,   // 6% of screen width
  paddingVertical: height * 0.02,    // 2% of screen height
}

// Button row
buttonRow: {
  flexDirection: 'row',
  gap: 12,                           // Fixed 12px gap between buttons
}
```

## Spacing

- **Modal padding**: 
  - Horizontal: width * 0.06
  - Vertical: height * 0.02

- **Button gap**: 12px (fixed)

- **Button margins**:
  - Left button (Decline): marginRight = width * 0.02
  - Right button (Accept): marginLeft = width * 0.02

## Typography

| Component | Font | Size | Weight |
|-----------|------|------|--------|
| Header | DM Sans / sans-serif | 20px | Bold |
| Body Text | Inter / sans-serif | 14px | Regular |
| Button Labels | DM Sans / sans-serif | 16px | Bold (700) |
| Link Text | Inter / sans-serif | 14px | Semi-bold (600) |

## Interaction States

### Decline Button
- **Default**: Gray outline, transparent background
- **Pressed**: Visual feedback (platform-dependent)
- **Disabled**: N/A (always enabled)

### Accept Button
- **Default**: Orange filled with shadow
- **Pressed**: Visual feedback with shadow
- **Disabled**: N/A (always enabled)

## Accessibility Features

- Clear text labels in Chinese
- Sufficient color contrast between text and background
- Adequate button size for touch interaction (min 44pt x 44pt recommended)
- Link is underlined and in a distinct color
- Modal prevents interaction with content below (transparent overlay)

## Animation

- **Modal appearance**: Fade in animation
- **Button interactions**: Platform-default button ripple/highlight effects
- **Link press**: Default linking behavior

## Platform-Specific Considerations

### iOS
- Uses "DM Sans" font for headers
- Uses "Inter" font for body text
- Shadow effects render as native iOS shadows
- Safe area insets handled by SafeAreaProvider

### Android
- Fallback to "sans-serif" if fonts not available
- Uses elevation property for shadows (elevation: 5)
- Material Design ripple effect on button press
- Same responsive layout calculations

