/**
 * Design tokens from Documentation/Design_System.md.
 * Use these for UI that follows the VenTong academic reference (MainPage / PassageMain).
 * Keep in sync with Design_System.md when updating.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Colors (Design_System.md §1)
// ---------------------------------------------------------------------------

export const designTokensColors = {
  // System background (unified for all screens: MainPage, PassageMain, auth, etc.)
  background: '#FDFBFA',
  bgCream: '#FDFBFA',

  // MainPage / Global
  primary: '#1A2B3C',
  accent: '#8E735B',
  cardBg: '#FFFFFF',
  textMain: '#2C2C2C',
  textMuted: '#6B7280',
  border: '#E5E1D8',
  progressBg: '#F0EDE5',

  // PassageMain (Reading) — background uses same as system (bgCream)
  navyDeep: '#1A2B3C',
  mutedOrange: '#D97706',
  /** Darker orange for queried-word underline (more visible) */
  darkOrange: '#B45309',
  sageGreen: '#E8F0E8',
  borderClassic: '#E5E1D8',

  // Status / Semantic
  completedBadgeBg: '#ECFDF5',
  completedBadgeText: '#047857',

  // Word Preview (Session Lexicon) — section badges
  badgeGreen: '#E8F5E9',
  badgeGreenText: '#2E7D32',
  badgeBlue: '#E3F2FD',
  badgeBlueText: '#1565C0',

  // Word Preview — card tap state
  wordCardTapBg: '#F8F6F2',

  // Auth (Login / Register) — WeChat button
  wechatGreen: '#07C160',

  // Auth — input placeholder (matches HTML placeholder style)
  placeholder: '#A1A1AA',

  /** Article Evaluation screen — academic theme (HTML --bg-academic) */
  evaluationScreenBg: '#FDFBF7',
} as const;

// ---------------------------------------------------------------------------
// 2. Typography (Design_System.md §2)
// ---------------------------------------------------------------------------

export const typography = {
  fontFamily: {
    body: Platform.select({ ios: 'Inter', android: 'sans-serif', default: 'sans-serif' }),
    serif: Platform.select({ ios: 'Playfair Display', android: 'serif', default: 'serif' }),
    serifChinese: Platform.select({ ios: 'Noto Serif SC', android: 'serif', default: 'serif' }),
    articleBody: Platform.select({ ios: 'Crimson Text', android: 'serif', default: 'serif' }),
    articleTitle: Platform.select({ ios: 'Playfair Display', android: 'serif', default: 'serif' }),
  },

  /** Font sizes (px) and line heights from Design_System.md */
  fontSize: {
    headerSubtitle: 9,
    sectionLabel: 10,
    smallLabel: 10,
    tabLabel: 9,
    bodySmall: 11,
    bodyMeta: 12,
    cardMeta: 12,
    cardTitle: 20,
    progressNumber: 48,
    progressOf: 20,
    articleTitle: 30,
    articleBody: 20,
    ctaStat: 17,
    buttonPrimary: 10,
    archivesLabel: 8,
  },

  lineHeight: {
    cardTitle: 1.25,
    articleBody: 1.75,
  },

  letterSpacing: {
    headerSubtitle: 0.3,
    sectionLabel: 0.2,
    buttonPrimary: 0.25,
    archivesLabel: 0.2,
    /** Auth header subtitle (e.g. “The Scholarly Digest”) — ~0.4em on 10px */
    authHeader: 4,
  },

  fontWeight: {
    bold: '700' as const,
    semibold: '600' as const,
    medium: '500' as const,
    regular: '400' as const,
  },
} as const;

// ---------------------------------------------------------------------------
// 3. Spacing & Layout (Design_System.md §3)
// ---------------------------------------------------------------------------

export const spacing = {
  pageHorizontal: 20,
  pageHorizontalWide: 24,
  sectionVertical: 24,
  sectionVerticalLarge: 40,
  cardPadding: 20,
  cardPaddingLarge: 28,
  cardGap: 16,
  headerPaddingVertical: 16,
  headerPaddingHorizontal: 24,
  bottomNavPaddingTop: 12,
  bottomNavPaddingBottom: 32,
  footerVertical: 20,
  footerHorizontal: 24,
  dropdownItemPaddingVertical: 16,
  dropdownItemPaddingHorizontal: 20,
  dropdownFooterPadding: 12,
} as const;

// ---------------------------------------------------------------------------
// SMS Verification — OTP box dimensions (from Academic SMS Verification design)
// ---------------------------------------------------------------------------

export const otp = {
  boxWidth: 45,
  boxHeight: 56,
  boxGap: 8,
  rowMaxWidth: 320,
  /** Small screens (e.g. max-width 380px) */
  boxWidthSmall: 40,
  boxHeightSmall: 50,
} as const;

// ---------------------------------------------------------------------------
// 4. Border Radius (Design_System.md §4)
// ---------------------------------------------------------------------------

export const radius = {
  cardLarge: 16,
  card: 12,
  button: 8,
  tag: 4,
  progressBar: 2,
  pill: 9999,
} as const;

// ---------------------------------------------------------------------------
// 5. Shadows (Design_System.md §5) — React Native style objects
// ---------------------------------------------------------------------------

export const shadows = {
  sophisticated: {
    shadowColor: '#1A2B3C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  card: {
    shadowColor: '#1A2B3C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  /** Word Preview (Session Lexicon) — lighter card shadow */
  wordCard: {
    shadowColor: '#1A2B3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;

// ---------------------------------------------------------------------------
// 6. Blur (Design_System.md §6) — values for expo-blur / backdrop
// ---------------------------------------------------------------------------

/** Blur overlay uses system background (#FDFBFA = rgb 253,251,250) for all screens */
export const blur = {
  headerIntensity: 80,
  headerBgOpacity: 0.8,
  headerBgRgba: 'rgba(253, 251, 250, 0.8)',
  /** Same as header — unified system background for PassageMain header/footer */
  footerBgRgba: 'rgba(253, 251, 250, 0.95)',
} as const;

// ---------------------------------------------------------------------------
// Convenience: single export for all tokens
// ---------------------------------------------------------------------------

export const designTokens = {
  colors: designTokensColors,
  typography,
  spacing,
  radius,
  shadows,
  blur,
  otp,
} as const;

export default designTokens;
