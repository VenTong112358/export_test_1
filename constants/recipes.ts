/**
 * Reusable style recipes (pattern library) for VenTong UI.
 * Maps design tokens to concrete style objects for cards, badges, buttons,
 * section headers, and progress bars. Aligned with the Tailwind/HTML reference.
 *
 * Usage: use in StyleSheet or inline, e.g. style={[recipes.card.default, ...]}
 */

import type { TextStyle, ViewStyle } from 'react-native';
import {
  designTokensColors as c,
  otp as otpTokens,
  radius as r,
  spacing as s,
  shadows as sh,
  typography as t,
} from './designTokens';

// ---------------------------------------------------------------------------
// Card variants
// ---------------------------------------------------------------------------

export const cardRecipes = {
  /** Default card: white bg, rounded, border, shadow (e.g. recommendation list item) */
  default: {
    backgroundColor: c.cardBg,
    borderRadius: r.card,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden' as const,
    ...sh.card,
  } as ViewStyle,

  /** Large card for “Today’s Progress” block */
  progress: {
    backgroundColor: c.cardBg,
    borderRadius: r.cardLarge,
    borderWidth: 1,
    borderColor: c.border,
    padding: s.cardPaddingLarge,
    overflow: 'hidden' as const,
    ...sh.sophisticated,
  } as ViewStyle,

  /** Recommendation card – default state */
  recommendation: {
    backgroundColor: c.cardBg,
    borderRadius: r.card,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden' as const,
    ...sh.card,
  } as ViewStyle,

  /** Recommendation card – active/selected (primary border, stronger shadow) */
  recommendationActive: {
    backgroundColor: c.cardBg,
    borderRadius: r.card,
    borderWidth: 2,
    borderColor: c.primary,
    overflow: 'hidden' as const,
    ...sh.sophisticated,
  } as ViewStyle,

  /** Recommendation card – muted (e.g. locked or disabled) */
  recommendationMuted: {
    backgroundColor: c.cardBg,
    borderRadius: r.card,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden' as const,
    opacity: 0.85,
  } as ViewStyle,

  /** Footer strip for a card (cream band, top border) */
  footerStrip: {
    backgroundColor: c.bgCream,
    paddingVertical: 12,
    paddingHorizontal: s.cardPadding,
    borderTopWidth: 1,
    borderTopColor: c.border,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  /** Word Preview: split word card (English | Chinese), lighter shadow */
  wordCard: {
    backgroundColor: c.cardBg,
    borderRadius: r.card,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden' as const,
    flexDirection: 'row' as const,
    ...sh.wordCard,
  } as ViewStyle,

  /** Word Preview: touchable half of word card (left or right) */
  wordCardSide: {
    flex: 1,
    padding: s.cardPadding,
  } as ViewStyle,
};

// ---------------------------------------------------------------------------
// Badge variants
// ---------------------------------------------------------------------------

export const badgeRecipes = {
  /** Topic tag: cream bg, accent text, border (e.g. “History”, “Science”) */
  topicCream: {
    backgroundColor: c.bgCream,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.tag,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
  } as ViewStyle,
  topicCreamText: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.bold,
    color: c.accent,
    letterSpacing: 2,
  } as TextStyle,

  /** Topic tag: primary filled (e.g. “Communication”) */
  topicPrimary: {
    backgroundColor: c.primary,
    borderRadius: r.tag,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
  } as ViewStyle,
  topicPrimaryText: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.bold,
    color: c.cardBg,
    letterSpacing: 2,
  } as TextStyle,

  /** Level/CEFR badge: accent style, cream-ish bg and border */
  levelAccent: {
    backgroundColor: c.bgCream,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.tag,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start' as const,
  } as ViewStyle,
  levelAccentText: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.bold,
    color: c.accent,
    letterSpacing: 1.5,
  } as TextStyle,

  /** Completed status (green semantic) */
  completed: {
    backgroundColor: c.completedBadgeBg,
    borderRadius: r.tag,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start' as const,
  } as ViewStyle,
  completedText: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.bold,
    color: c.completedBadgeText,
    letterSpacing: 1.5,
  } as TextStyle,

  /** Muted topic (e.g. inactive or secondary) */
  topicMuted: {
    backgroundColor: c.bgCream,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.tag,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
  } as ViewStyle,
  topicMutedText: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: 2,
  } as TextStyle,

  /** Word Preview: “New Academic Terms” — green pill */
  badgeGreen: {
    backgroundColor: c.badgeGreen,
    borderRadius: r.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
  } as ViewStyle,
  badgeGreenText: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.badgeGreenText,
    letterSpacing: 1.5,
  } as TextStyle,

  /** Word Preview: “Terms for Review” — blue pill */
  badgeBlue: {
    backgroundColor: c.badgeBlue,
    borderRadius: r.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
  } as ViewStyle,
  badgeBlueText: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.badgeBlueText,
    letterSpacing: 1.5,
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Button variants
// ---------------------------------------------------------------------------

export const buttonRecipes = {
  /** Primary CTA (e.g. “Commence Reading”) */
  primaryCta: {
    backgroundColor: c.primary,
    paddingVertical: 14,
    paddingHorizontal: s.cardPadding,
    borderRadius: r.button,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  primaryCtaText: {
    fontSize: t.fontSize.buttonPrimary,
    fontWeight: t.fontWeight.bold,
    color: c.cardBg,
    letterSpacing: t.letterSpacing.buttonPrimary,
  } as TextStyle,

  /** Word Preview footer: “Commence Study” — full width, larger tap area */
  primaryCtaLarge: {
    backgroundColor: c.primary,
    paddingVertical: 16,
    paddingHorizontal: s.cardPadding,
    borderRadius: r.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...sh.button,
  } as ViewStyle,
  primaryCtaLargeText: {
    fontSize: t.fontSize.bodySmall,
    fontWeight: t.fontWeight.bold,
    color: c.cardBg,
    letterSpacing: 3,
  } as TextStyle,

  /** Word Preview footer: “Hide English” / “Show Chinese” — outline, primary tint */
  secondaryOutline: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 60, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(26, 43, 60, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: s.cardGap,
    borderRadius: r.button,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  } as ViewStyle,
  secondaryOutlineText: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    letterSpacing: 2,
  } as TextStyle,

  /** Icon-only ghost (e.g. header/nav icon) */
  iconGhost: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: r.pill,
  } as ViewStyle,

  /** Nav tab item – active */
  navTabActive: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  navTabActiveText: {
    fontSize: t.fontSize.tabLabel,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    marginTop: 4,
    letterSpacing: 1,
  } as TextStyle,

  /** Nav tab item – inactive */
  navTab: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  navTabText: {
    fontSize: t.fontSize.tabLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  } as TextStyle,

  /** SMS Verification: Resend Code — full border, white bg, italic primary text */
  resendOutline: {
    backgroundColor: c.cardBg,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 16,
    paddingHorizontal: s.cardPadding,
    borderRadius: r.button,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  resendOutlineText: {
    fontSize: t.fontSize.bodySmall,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    letterSpacing: 2,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
  } as TextStyle,

  /** Auth (Login): WeChat — outline green, white bg */
  wechatOutline: {
    backgroundColor: c.cardBg,
    borderWidth: 1,
    borderColor: c.wechatGreen,
    paddingVertical: 14,
    paddingHorizontal: s.cardPadding,
    borderRadius: r.button,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  } as ViewStyle,
  wechatOutlineText: {
    fontSize: t.fontSize.bodySmall,
    fontWeight: t.fontWeight.bold,
    color: c.wechatGreen,
    letterSpacing: 2,
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Section header styles
// ---------------------------------------------------------------------------

export const sectionHeaderRecipes = {
  /** Row: title + optional date/action, border-bottom */
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    marginBottom: s.cardGap,
  } as ViewStyle,

  /** Section title (e.g. “Daily Recommendations”) */
  title: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    letterSpacing: t.letterSpacing.sectionLabel,
  } as TextStyle,

  /** Section date or subtitle on the right */
  date: {
    fontSize: t.fontSize.smallLabel,
    fontWeight: t.fontWeight.medium,
    color: c.textMuted,
  } as TextStyle,

  /** Small label above a stat block (e.g. “Today’s Progress”) */
  progressLabel: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: t.letterSpacing.sectionLabel,
    marginBottom: 8,
  } as TextStyle,

  /** Stats block header (e.g. “Lexical Mastery”) */
  statsLabel: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: t.letterSpacing.sectionLabel,
    marginBottom: 8,
    opacity: 0.8,
  } as TextStyle,

  /** Word Preview: row with section badge + “X ITEMS” count */
  wordPreviewRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: s.cardPadding,
  } as ViewStyle,

  /** Word Preview: “4 ITEMS” / “2 ITEMS” count text */
  wordPreviewCount: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Auth (Login) — header / branding
// ---------------------------------------------------------------------------

export const authRecipes = {
  /** Small label above logo (e.g. “The Scholarly Digest”) */
  subtitle: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.accent,
    letterSpacing: t.letterSpacing.authHeader,
    marginBottom: 8,
  } as TextStyle,

  /** Main logo/title (e.g. “VenTong”) */
  title: {
    fontSize: t.fontSize.progressNumber,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
  } as TextStyle,

  /** Thin accent line under logo */
  divider: {
    width: 48,
    height: 1,
    backgroundColor: c.accent,
    opacity: 0.3,
    marginTop: 24,
  } as ViewStyle,
};

// ---------------------------------------------------------------------------
// Form (Login) — inputs & divider
// ---------------------------------------------------------------------------

export const formRecipes = {
  /** Underline-only input (transparent bg, bottom border); focus → borderBottomColor primary */
  inputUnderline: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: 0,
  } as ViewStyle,

  /** Label above input (Username / 用户名) */
  inputLabel: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,

  /** Row for “or” divider */
  dividerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  } as ViewStyle,

  /** Line segment left/right of “or” */
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.border,
  } as ViewStyle,

  /** “or” text */
  dividerText: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: 2,
    marginHorizontal: 16,
  } as TextStyle,

  /** Register: checkbox row (Privacy Policy agreement) — flex items-center gap-3 pt-2 */
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingTop: 8,
  } as ViewStyle,

  /** Register: label text “I agree to the…” — 11px serif italic muted */
  checkboxLabel: {
    flex: 1,
    fontSize: t.fontSize.bodySmall,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
    color: c.textMuted,
  } as TextStyle,

  /** Register: inline link “Privacy Policy / 隐私政策” — primary + underline */
  checkboxLink: {
    fontSize: t.fontSize.bodySmall,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
    color: c.primary,
    textDecorationLine: 'underline',
  } as TextStyle,

  /** SMS Verification: title “Enter 6-digit SMS code” */
  smsTitle: {
    fontSize: 24,
    fontFamily: t.fontFamily.serif,
    color: c.primary,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  } as TextStyle,

  /** SMS Verification: subtitle “Verification sent to your mobile device” */
  smsSubtitle: {
    fontSize: t.fontSize.bodyMeta,
    color: c.textMuted,
    fontFamily: t.fontFamily.serif,
    textAlign: 'center',
  } as TextStyle,

  /** SMS Verification: row of 6 OTP inputs — flex justify-between gap-2 max-w-[320px] */
  otpRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: otpTokens.boxGap,
    maxWidth: otpTokens.rowMaxWidth,
    alignSelf: 'center' as const,
    marginBottom: 48,
  } as ViewStyle,

  /** SMS Verification: single OTP digit box — border, transparent bg, focus → border primary */
  otpBox: {
    width: otpTokens.boxWidth,
    height: otpTokens.boxHeight,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: 'transparent',
    borderRadius: 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  /** SMS Verification: digit text inside OTP box — 1.5rem serif primary center */
  otpBoxText: {
    fontSize: 24,
    fontFamily: t.fontFamily.serif,
    color: c.primary,
    textAlign: 'center',
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Link (Auth footer) — Forgot password, Register, Est.
// ---------------------------------------------------------------------------

export const linkRecipes = {
  /** Forgot password — small serif italic primary, muted */
  footer: {
    fontSize: t.fontSize.sectionLabel,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
    color: c.primary,
    opacity: 0.8,
  } as TextStyle,

  /** Register / 没有账号？ — slightly larger, medium weight */
  footerHighlight: {
    fontSize: t.fontSize.bodySmall,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: t.fontWeight.medium,
    color: c.primary,
  } as TextStyle,

  /** Est. MMXXIV — smallest muted */
  footerMuted: {
    fontSize: t.fontSize.archivesLabel,
    color: c.textMuted,
    opacity: 0.5,
    letterSpacing: t.letterSpacing.archivesLabel,
  } as TextStyle,

  /** SMS Verification: “Return to Login” — text-only, 11px uppercase serif primary, muted */
  smsReturn: {
    fontSize: t.fontSize.bodySmall,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    letterSpacing: 2,
    fontFamily: t.fontFamily.serif,
    opacity: 0.7,
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Article Evaluation (article-rate) — academic theme
// ---------------------------------------------------------------------------

export const articleEvaluationRecipes = {
  /** Screen container background */
  screenBg: {
    flex: 1,
    backgroundColor: c.evaluationScreenBg,
  } as ViewStyle,

  /** Sticky header: back + VENTONG + Skip — h-16, border-bottom */
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: s.pageHorizontal,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.evaluationScreenBg,
  } as ViewStyle,

  /** Left: back icon + “VENTONG” label */
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  } as ViewStyle,

  /** “VENTONG” — 14px uppercase tracking, semibold, primary, opacity 0.8 */
  headerBrand: {
    fontSize: 14,
    fontWeight: t.fontWeight.semibold,
    color: c.primary,
    letterSpacing: 3,
    opacity: 0.8,
  } as TextStyle,

  /** “Skip / 跳过” — 14px semibold primary opacity 0.7 */
  headerSkip: {
    fontSize: 14,
    fontWeight: t.fontWeight.semibold,
    color: c.primary,
    letterSpacing: 1,
    opacity: 0.7,
  } as TextStyle,

  /** Main content — centered, max-width feel, padding */
  main: {
    flex: 1,
    paddingHorizontal: s.pageHorizontalWide,
    paddingTop: 40,
    paddingBottom: 120,
    alignItems: 'center',
  } as ViewStyle,

  /** “ARTICLE EVALUATION” — serif 3xl italic bold */
  pageTitle: {
    fontSize: 28,
    fontFamily: t.fontFamily.articleTitle,
    fontWeight: t.fontWeight.bold,
    fontStyle: 'italic',
    color: c.primary,
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  } as TextStyle,

  /** Subtitle “Please rate the quality…” — 17px italic muted */
  subtitle: {
    fontSize: 17,
    fontFamily: t.fontFamily.articleBody,
    fontStyle: 'italic',
    color: c.primary,
    opacity: 0.9,
    lineHeight: 26,
    marginBottom: 40,
    textAlign: 'center',
  } as TextStyle,

  /** One dimension block — title + stars */
  dimensionBlock: {
    alignItems: 'center',
    marginBottom: 32,
  } as ViewStyle,

  /** Dimension title (e.g. “1. Lexical Appropriateness”) — 18px semibold */
  dimensionTitle: {
    fontSize: 18,
    fontWeight: t.fontWeight.semibold,
    color: c.primary,
    marginBottom: 12,
    textAlign: 'center',
  } as TextStyle,

  /** Row of 5 stars — gap 8 */
  starRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  } as ViewStyle,

  /** Fixed footer — submit button area */
  footer: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: s.pageHorizontalWide,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.evaluationScreenBg,
  } as ViewStyle,

  /** Full-width navy submit button — h-12, rounded, shadow */
  submitButton: {
    width: '100%',
    height: 48,
    backgroundColor: c.primary,
    borderRadius: r.button,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    ...sh.button,
  } as ViewStyle,

  /** Submit button text “SUBMIT EVALUATION / 提交评价” — serif italic 17px white */
  submitButtonText: {
    fontSize: 17,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: t.fontWeight.semibold,
    color: c.cardBg,
    letterSpacing: 1,
  } as TextStyle,

  /** Success modal overlay */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  } as ViewStyle,

  /** Success modal content — white card */
  modalContent: {
    backgroundColor: c.cardBg,
    borderRadius: r.cardLarge,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    ...sh.sophisticated,
  } as ViewStyle,

  /** Success modal message */
  modalMessage: {
    fontSize: 16,
    fontWeight: t.fontWeight.medium,
    color: c.textMuted,
    textAlign: 'center',
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Scholar Profile (profile / Me tab) — HTML Scholar Profile design
// ---------------------------------------------------------------------------

export const scholarProfileRecipes = {
  /** Screen: bg cream, padding bottom for nav */
  screen: {
    flex: 1,
    backgroundColor: c.bgCream,
    paddingBottom: 120,
  } as ViewStyle,

  /** Sticky header: centered column, blur + border-bottom, px-6 py-4 */
  header: {
    paddingHorizontal: s.pageHorizontalWide,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.bgCream,
    alignItems: 'center' as const,
  } as ViewStyle,

  /** “VenTong / 仝文馆” — 9px uppercase accent, tracking */
  headerSubtitle: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.bold,
    color: c.accent,
    letterSpacing: 4,
    marginBottom: 2,
  } as TextStyle,

  /** “Scholar's Profile” — serif lg bold italic primary */
  headerTitle: {
    fontSize: 18,
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    fontStyle: 'italic',
    color: c.primary,
  } as TextStyle,

  /** Profile block: avatar + name + badge, centered, mb-10 */
  profileBlock: {
    alignItems: 'center' as const,
    marginBottom: 40,
  } as ViewStyle,

  /** Avatar outer: 96px circle, border, white bg, p-1 */
  avatarOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: c.border,
    padding: 4,
    backgroundColor: c.cardBg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden',
  } as ViewStyle,

  /** Avatar inner: full rounded, cream bg, person icon placeholder */
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: c.bgCream,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,

  /** Display name — serif 2xl bold primary */
  displayName: {
    fontSize: 24,
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    marginBottom: 4,
  } as TextStyle,

  /** Role badge pill: border accent, accent text, 10px bold uppercase */
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: c.accent,
    borderRadius: r.pill,
  } as ViewStyle,

  roleBadgeText: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.accent,
    letterSpacing: 3,
  } as TextStyle,

  /** Lexical Achievement card: white, rounded-2xl, p-6, border, shadow */
  achievementCard: {
    backgroundColor: c.cardBg,
    borderRadius: r.cardLarge,
    padding: 24,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 40,
    ...sh.sophisticated,
  } as ViewStyle,

  /** Card section title “Lexical Achievement” — 10px bold muted uppercase, center, border-b */
  achievementCardTitle: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: 3,
    marginBottom: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.bgCream,
    textAlign: 'center',
  } as TextStyle,

  /** Row of two stats (Words Mastered | Day Streak) */
  achievementRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderTopWidth: 0,
  } as ViewStyle,

  /** One stat column: flex-1, centered */
  achievementStat: {
    flex: 1,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
  } as ViewStyle,

  /** Second stat column with left divider (divide-x) */
  achievementStatRight: {
    flex: 1,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: c.border,
  } as ViewStyle,

  /** Big number — 30px serif bold primary */
  achievementStatValue: {
    fontSize: 30,
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
  } as TextStyle,

  /** Label under stat — 10px uppercase bold muted */
  achievementStatLabel: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  } as TextStyle,

  /** Section title “Academic Settings” — 10px bold muted uppercase */
  settingsSectionTitle: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: 4,
    marginLeft: 8,
    marginBottom: 8,
  } as TextStyle,

  /** Single setting row: white, rounded-xl, border, px-5 py-4, row */
  settingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: c.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  } as ViewStyle,

  /** Left column: label + value */
  settingRowLeft: {
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
  } as ViewStyle,

  /** Setting label — 10px bold muted uppercase */
  settingRowLabel: {
    fontSize: t.fontSize.sectionLabel,
    fontWeight: t.fontWeight.bold,
    color: c.textMuted,
    letterSpacing: 2,
    marginBottom: 2,
  } as TextStyle,

  /** Setting value — serif bold primary */
  settingRowValue: {
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    fontSize: 16,
  } as TextStyle,

  /** Log out button: full width, border primary, rounded-xl, py-4 */
  logoutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: c.primary,
    borderRadius: 12,
    gap: 12,
  } as ViewStyle,

  /** Log out text “Log Out / 退出登录” — serif bold uppercase primary */
  logoutButtonText: {
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    fontSize: 14,
    letterSpacing: 2,
  } as TextStyle,

  /** Version line — 9px muted uppercase */
  versionText: {
    fontSize: t.fontSize.headerSubtitle,
    fontWeight: t.fontWeight.medium,
    color: c.textMuted,
    letterSpacing: 4,
    marginTop: 24,
    textAlign: 'center',
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Passage reading (PassageMain) — Academic theme variant 2
// ---------------------------------------------------------------------------

export const passageReadingRecipes = {
  /** Screen: academic bg */
  screen: {
    flex: 1,
    backgroundColor: c.bgCream,
  } as ViewStyle,

  /** Reading progress bar: full width 1px track, fill = primary */
  progressTrack: {
    width: '100%',
    height: 1,
    backgroundColor: c.borderClassic,
  } as ViewStyle,

  progressFill: {
    height: '100%',
    backgroundColor: c.navyDeep,
  } as ViewStyle,

  /** Article area: flex-1, horizontal padding, pt-10 pb-36 */
  articleContainer: {
    flex: 1,
    paddingHorizontal: s.pageHorizontalWide,
    paddingTop: 40,
    paddingBottom: 140,
  } as ViewStyle,

  /** Article title — Playfair, slightly smaller, tight with subtitle */
  articleTitle: {
    fontSize: 24,
    fontFamily: t.fontFamily.articleTitle,
    fontWeight: t.fontWeight.bold,
    fontStyle: 'italic',
    color: c.navyDeep,
    lineHeight: 32,
    marginBottom: 6,
  } as TextStyle,

  /** Article subtitle (Chinese title) — muted, tight under title */
  articleSubtitle: {
    fontSize: t.fontSize.bodyMeta,
    color: c.textMuted,
    marginBottom: 12,
  } as TextStyle,

  /** Title separator line — optional */
  titleSeparator: {
    height: 2,
    backgroundColor: c.borderClassic,
    borderRadius: 1,
    marginVertical: 8,
  } as ViewStyle,

  /** Article body — Crimson 20px line-height 1.75 navy */
  articleBody: {
    fontSize: t.fontSize.articleBody,
    fontFamily: t.fontFamily.articleBody,
    lineHeight: t.fontSize.articleBody * t.lineHeight.articleBody,
    color: c.navyDeep,
  } as TextStyle,

  /** New word: sage green background highlight */
  wordNew: {
    backgroundColor: c.sageGreen,
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 2,
  } as TextStyle,

  /** User clicked / looked up: dark orange underline (textDecoration is reliable on all platforms) */
  wordQueried: {
    textDecorationLine: 'underline',
    textDecorationColor: c.darkOrange,
    textDecorationStyle: 'solid',
  } as TextStyle,

  /** Reviewed word: grey muted color, no background */
  wordReview: {
    color: c.textMuted,
  } as TextStyle,

  /** Bottom bar: fixed, blur bg, border-top */
  bottomBar: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: s.pageHorizontalWide,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: c.borderClassic,
    backgroundColor: c.bgCream,
  } as ViewStyle,

  /** Finish Reading button — full width navy, h-12, serif italic */
  finishButton: {
    width: '100%',
    height: 48,
    backgroundColor: c.navyDeep,
    borderRadius: r.button,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    ...sh.button,
  } as ViewStyle,

  finishButtonText: {
    fontSize: 17,
    fontFamily: t.fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: t.fontWeight.semibold,
    color: c.cardBg,
    letterSpacing: 1,
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Daily Goal Selection (change-daily-goal / onboarding daily goal)
// ---------------------------------------------------------------------------

export const dailyGoalSelectionRecipes = {
  /** Screen: cream bg, padding */
  screen: {
    flex: 1,
    backgroundColor: c.bgCream,
    paddingHorizontal: s.pageHorizontalWide,
    paddingTop: 32,
    paddingBottom: 24,
  } as ViewStyle,

  /** Header: centered, mt-8 */
  header: {
    alignItems: 'center' as const,
    marginTop: 24,
  } as ViewStyle,

  /** Title: 设定您的每日学业目标 — 2xl serif bold primary, uppercase tracking */
  headerTitle: {
    fontSize: 24,
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
    lineHeight: 32,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,

  /** Subtitle: Select a daily word target… — 13px muted */
  headerSubtitle: {
    fontSize: 13,
    fontWeight: t.fontWeight.medium,
    color: c.textMuted,
    lineHeight: 20,
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 240,
  } as TextStyle,

  /** Divider: accent line, opacity 30 */
  headerDivider: {
    width: 48,
    height: 1,
    backgroundColor: c.accent,
    opacity: 0.3,
    marginTop: 40,
  } as ViewStyle,

  /** Main: centered, max-width feel, gap between cards */
  main: {
    flex: 1,
    justifyContent: 'center' as const,
    maxWidth: 400,
    alignSelf: 'center' as const,
    width: '100%',
    marginVertical: 48,
  } as ViewStyle,

  /** Goal card list — gap 16 */
  goalCardList: {
    gap: 16,
  } as ViewStyle,

  /** Single goal card: border primary, bg white, rounded-sm, py-6 */
  goalCard: {
    borderWidth: 1,
    borderColor: c.primary,
    backgroundColor: c.cardBg,
    paddingVertical: 24,
    borderRadius: 4,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,

  /** Goal card — selected state: bg primary, border primary */
  goalCardSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  } as ViewStyle,

  /** Goal card title: 每日N篇文章 — lg bold serif */
  goalCardTitle: {
    fontSize: 18,
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    color: c.primary,
  } as TextStyle,

  /** Goal card title — selected: white */
  goalCardTitleSelected: {
    color: c.cardBg,
  } as TextStyle,

  /** Goal card subtitle: Light Study / Regular Practice — 9px uppercase */
  goalCardSubtitle: {
    fontSize: 9,
    fontWeight: t.fontWeight.bold,
    letterSpacing: 3,
    marginTop: 4,
    color: c.primary,
    opacity: 0.6,
  } as TextStyle,

  /** Goal card subtitle — selected: white, opacity 80 */
  goalCardSubtitleSelected: {
    color: c.cardBg,
    opacity: 0.8,
  } as TextStyle,

  /** Footer: pb-6 (use flex:1 on main above to push footer down) */
  footer: {
    paddingBottom: 24,
  } as ViewStyle,

  /** Confirm button: full width primary, py-5, rounded-sm, serif bold 13px uppercase */
  confirmButton: {
    width: '100%',
    backgroundColor: c.primary,
    paddingVertical: 20,
    borderRadius: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...sh.button,
  } as ViewStyle,

  confirmButtonText: {
    fontFamily: t.fontFamily.serif,
    fontWeight: t.fontWeight.bold,
    fontSize: 13,
    color: c.cardBg,
    letterSpacing: 4,
  } as TextStyle,

  /** Footer quote — 10px muted italic */
  footerQuote: {
    fontSize: 10,
    fontWeight: t.fontWeight.medium,
    color: c.textMuted,
    letterSpacing: 1,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
  } as TextStyle,
};

// ---------------------------------------------------------------------------
// Progress bar styles
// ---------------------------------------------------------------------------

export const progressBarRecipes = {
  /** Track (background) */
  track: {
    height: 4,
    backgroundColor: c.progressBg,
    borderRadius: r.progressBar,
    overflow: 'hidden' as const,
  } as ViewStyle,

  /** Fill (foreground) – set width via percentage or flex */
  fill: {
    height: '100%' as const,
    backgroundColor: c.primary,
    borderRadius: r.progressBar,
  } as ViewStyle,
};

// ---------------------------------------------------------------------------
// Single export object (recipes)
// ---------------------------------------------------------------------------

export const recipes = {
  card: cardRecipes,
  badge: badgeRecipes,
  button: buttonRecipes,
  sectionHeader: sectionHeaderRecipes,
  auth: authRecipes,
  form: formRecipes,
  link: linkRecipes,
  progressBar: progressBarRecipes,
  articleEvaluation: articleEvaluationRecipes,
  scholarProfile: scholarProfileRecipes,
  passageReading: passageReadingRecipes,
  dailyGoalSelection: dailyGoalSelectionRecipes,
} as const;

export default recipes;
