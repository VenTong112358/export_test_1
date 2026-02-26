/**
 * App theme and design tokens.
 * Light/dark theme colors are aligned with Design_System.md (see constants/designTokens.ts).
 */

import { Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { designTokensColors, otp, radius, shadows, spacing, typography } from './designTokens';

// Re-export design tokens for convenience
export { designTokens, designTokensColors, otp, radius, shadows, spacing, typography } from './designTokens';

const tintColorLight = designTokensColors.primary;
const tintColorDark = '#fff';

/** System background: same #FDFBFA for all screens (MainPage, PassageMain, auth, etc.) */
const systemBackground = designTokensColors.background;

export const Colors = {
  light: {
    text: designTokensColors.textMain,
    background: systemBackground,
    tint: tintColorLight,
    icon: designTokensColors.textMuted,
    tabIconDefault: designTokensColors.textMuted,
    tabIconSelected: tintColorLight,
    accent: designTokensColors.accent,
    border: designTokensColors.border,
    surface: designTokensColors.cardBg,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    accent: designTokensColors.accent,
    border: designTokensColors.border,
    surface: '#1F1F1F',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
    /** Design system: body / UI */
    body: 'Inter',
    /** Design system: editorial / titles */
    editorial: 'Playfair Display',
    articleBody: 'Crimson Text',
    articleTitle: 'Playfair Display',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    body: typography.fontFamily.body,
    editorial: typography.fontFamily.serif,
    articleBody: typography.fontFamily.articleBody,
    articleTitle: typography.fontFamily.articleTitle,
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    body: 'Inter',
    editorial: 'Playfair Display',
    articleBody: 'Crimson Text',
    articleTitle: 'Playfair Display',
  },
});

export type AppTheme = typeof lightTheme;

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: designTokensColors.primary,
    secondary: designTokensColors.accent,
    background: systemBackground,
    surface: designTokensColors.cardBg,
    error: '#B3261E',
    // Design system aliases for Paper / useTheme
    onSurface: designTokensColors.textMain,
    onSurfaceVariant: designTokensColors.textMuted,
    outline: designTokensColors.border,
    // Extra design tokens available on theme
    accent: designTokensColors.accent,
    textMuted: designTokensColors.textMuted,
    border: designTokensColors.border,
    progressBg: designTokensColors.progressBg,
    completedBadgeBg: designTokensColors.completedBadgeBg,
    completedBadgeText: designTokensColors.completedBadgeText,
    evaluationScreenBg: designTokensColors.evaluationScreenBg,
  },
  spacing,
  radius,
  shadows,
  typography,
  otp,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: designTokensColors.primary,
    secondary: designTokensColors.accent,
    background: '#151718',
    surface: '#1F1F1F',
    error: '#F2B8B5',
    onSurface: '#ECEDEE',
    onSurfaceVariant: '#9BA1A6',
    outline: designTokensColors.border,
    accent: designTokensColors.accent,
    textMuted: '#9BA1A6',
    border: designTokensColors.border,
    progressBg: '#2C2C2C',
    completedBadgeBg: designTokensColors.completedBadgeBg,
    completedBadgeText: designTokensColors.completedBadgeText,
  },
  spacing,
  radius,
  shadows,
  typography,
  otp,
};
