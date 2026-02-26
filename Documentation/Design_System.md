# VenTong Design System

This document is derived from the **MainPage** and **PassageMain** reference UI (HTML/Tailwind). Use these tokens and patterns when implementing or redesigning the React Native app so the experience stays consistent.

---

## 1. Color Palette

### System background (unified)

All app screens (MainPage, PassageMain, and others) use the **same page background** for consistency.

| Token | Hex | Usage |
|-------|-----|--------|
| `--background` / `--bg-cream` | `#FDFBFA` | **System page background** — use for all full-screen backgrounds (MainPage, PassageMain, auth, etc.) |

### MainPage / Global

| Token | Hex | Usage |
|-------|-----|--------|
| `--primary` | `#1A2B3C` | Primary navy; headers, key text, primary buttons, progress fill, active states |
| `--accent` | `#8E735B` | Accent brown; labels, badges, icons, streak, secondary emphasis |
| `--card-bg` | `#FFFFFF` | Card and panel background |
| `--text-main` | `#2C2C2C` | Primary body text |
| `--text-muted` | `#6B7280` | Secondary text, captions, meta |
| `--border-color` | `#E5E1D8` | Borders, dividers, subtle outlines |
| `--progress-bg` | `#F0EDE5` | Track (unfilled) part of progress bar |

### PassageMain (Reading)

| Token | Hex | Usage |
|-------|-----|--------|
| *(background)* | `#FDFBFA` | Same as system background (`--bg-cream`) |
| `--navy-deep` | `#1A2B3C` | Same as primary; article text, header, buttons |
| `--muted-orange` | `#D97706` | **New word** underline (do not use bright orange) |
| `--sage-green` | `#E8F0E8` | **Review word** highlight background |
| `--border-classic` | `#E5E1D8` | Same as border-color; header/footer borders |

### Status / Semantic

| Usage | Hex / Note |
|-------|------------|
| Completed badge | `#ECFDF5` bg, `#047857` text (emerald-50 / emerald-700) |
| Level / CEFR badge | Accent or `--bg-cream` + border |

---

## 2. Typography

### Font Families

| Role | Web (reference) | React Native suggestion |
|------|------------------|-------------------------|
| **Body / UI** | Inter | System default or Inter |
| **Serif / editorial** | Playfair Display, Noto Serif SC | Playfair Display, or Noto Serif SC for Chinese |
| **Article body (reading)** | Crimson Text | Crimson Text or similar serif |
| **Article title (reading)** | Playfair Display | Playfair Display |

### Font Sizes & Weights

| Use | Size (approx) | Weight | Notes |
|-----|----------------|--------|--------|
| Header subtitle (e.g. "The Scholarly Digest") | 9px | Bold | Uppercase, letter-spacing ~0.3em |
| Section labels / overlines | 10px | Bold | Uppercase, letter-spacing 0.2em |
| Small labels (Lexis, Est. Time) | 10px | Bold | Uppercase, tracking |
| Tab / nav labels | 9px | Bold | Uppercase, tracking |
| Body small / meta | 11–12px | Regular/Medium | Muted color |
| Card meta (New/Review counts) | 12–14px | Bold serif | Primary color |
| Card title | 20px (xl) | Bold serif | Primary, leading-snug |
| Progress number ("2") | 48px (5xl) | Bold serif | Primary |
| Progress "of 5" | 20px | Serif italic | Muted |
| Article title (PassageMain) | 30px (3xl) | Serif | Italic, navy-deep |
| Article body (PassageMain) | 20px | Serif | line-height 1.75 |
| CTA / big stat | 17px italic or 3xl | Bold serif | e.g. "4,820 Words" |
| Button label (primary) | 10px | Bold | Uppercase, letter-spacing 0.25em |

---

## 3. Spacing & Layout

| Token | Value | Usage |
|-------|--------|--------|
| Page horizontal padding | 20–24px (px-5 / px-6) | Main content |
| Section vertical spacing | 24–40px (py-6, mb-10) | Between sections |
| Card padding | 20–28px (p-5 / p-7) | Inner padding of cards |
| Card gap (stacked) | 16px (space-y-4) | Between recommendation cards |
| Header padding | 16px vertical, 24px horizontal | Sticky header |
| Bottom nav padding | 12px top, 32px bottom + safe area | Tab bar |
| Footer (PassageMain) | 20px vertical, 24px horizontal | Finish bar |

---

## 4. Border Radius

| Element | Radius |
|---------|--------|
| Cards (large, e.g. progress card) | 16px (rounded-2xl) |
| Cards (recommendation) | 12px (rounded-xl) |
| Buttons (pill / full) | 8px or full (rounded-full for toggle) |
| Tags / badges | 4px (rounded-sm) |
| Progress bar | 2px |
| Lang toggle (PassageMain) | Full (pill) |

---

## 5. Shadows & Elevation

| Name | CSS (reference) | Usage |
|------|------------------|--------|
| Sophisticated shadow | `0 10px 30px -12px rgba(26, 43, 60, 0.1)` | Cards, dropdowns |
| Card (subtle) | Same or lighter | Recommendation cards |
| Button (PassageMain) | `shadow-lg` | "Finish Reading" |

In React Native: use `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` and/or `elevation` to approximate.

---

## 6. Blur & Overlays

- **Header / Nav**: `backdrop-filter: blur(20px)` (or 10px), background `rgba(253, 251, 250, 0.8)` (system background #FDFBFA).
- React Native: use `BlurView` (expo-blur) for similar effect on header/footer.

---

## 7. MainPage Components

### Header

- Sticky; blur; border-bottom `--border-color`.
- Left: Two lines — small uppercase label (accent, 9px), then "VenTong" (serif, 2xl, bold, italic, primary).
- Right: Menu icon (Material Symbols Outlined); opens dropdown.

### Dropdown Menu

- Position: below menu icon, right-aligned; width ~224px (w-56).
- Background: `--bg-cream`, border, sophisticated shadow, rounded-lg.
- Items: icon (accent) + label (serif bold primary, sm); bottom section "Archives Selection" in muted 8px uppercase.

### Today's Progress Card

- White card, rounded-2xl, border, sophisticated shadow, padding ~28px.
- Top row: left — "Today's Progress" (10px uppercase muted), big number "2" (5xl serif bold primary), "of 5" (xl serif italic muted). Right — streak badge (cream bg, border, accent icon, 10px uppercase primary).
- Progress bar: 4px height, `--progress-bg` track, `--primary` fill, 2px radius.
- Caption: quote in 11px serif italic muted; percentage right-aligned primary bold.

### Section Title (e.g. "Daily Recommendations")

- Row: left — label (xs bold uppercase primary, 0.2em tracking); right — date (10px muted).
- Border-bottom `--border-color`, padding-bottom 12px.

### Recommendation Cards

- **Default (unselected)**: White (or white/70) bg, rounded-xl, border, card-transition; tap scale 0.98.
- **Current / to-read**: Border 2px primary, sophisticated shadow; bottom CTA button full width primary bg, white text, "Commence Reading" (10px uppercase, 0.25em tracking).
- **Completed**: Same card; top-right badge "Completed" (emerald); bottom strip with cream bg, finished time italic, check icon.

Card interior:

- **Topic tag**: Small pill — either cream bg + border (muted) or primary bg + white text (for current). 9px uppercase tracking-widest.
- **Level/CEFR badge**: 9px uppercase; e.g. "C1 Proficiency", "Upper Intermediate", "B2 Level".
- **Title**: Serif xl bold primary, leading-snug.
- **Meta row**: "Lexis: X New / Y Review" or "X New", dot separator, "Est. Z Min" or "B2 Level"; 10px uppercase bold muted/primary/accent as in reference.

### Lexical Mastery CTA

- Full-width block, primary bg, rounded-2xl, padding 24px, white text.
- Left: "Lexical Mastery" (10px uppercase 0.2em, 60% opacity), big number + "Words" (serif 3xl italic + small sans).
- Right: Icon button (white/10 bg, rounded-full).
- Decorative: blur circle bottom-right.

### Bottom Navigation

- 5 items: Readings (active), Vocabulary, Archives, Analysis, Me.
- Active: primary color, icon fill; inactive: muted.
- Labels: 9px uppercase tracking-wider below icon.
- Bar: blur, border-top, safe-area-bottom padding.

---

## 8. PassageMain (Reading) Components

### Header

- Height 64px; academic-header (blur, border-classic bottom).
- Left: Back button (arrow_back_ios), then "VenTong Academic" (14px uppercase tracking-widest, ~70% opacity).
- Right: Control group — border, rounded-md, two buttons: text_fields (font size), format_line_spacing (line spacing).

### Reading Progress Strip

- 1px full-width bar; background `--border-classic`; fill `--navy-deep` (e.g. 25% width). Optional for scroll progress.

### Article

- Max width ~672px (max-w-2xl) centered; padding horizontal 32px, top 40px, bottom ~144px for footer.

**Title**

- Font: Playfair Display; 30px; bold; italic; navy-deep; tight leading.

**Body**

- Font: Crimson Text; 20px; line-height 1.75; navy-deep; paragraph spacing ~28px.

**New word (in-text)**

- `border-bottom: 1.5px solid var(--muted-orange)` (#D97706).
- No background; cursor pointer.

**Review word (in-text)**

- Background `--sage-green` (#E8F0E8); padding 0 2px; border-radius 2px; cursor pointer.

### Footer (Finish Bar)

- Fixed bottom; academic-footer (blur, border-classic top); safe-area bottom padding.
- Left: "Lang" label (11px bold uppercase 40% opacity); toggle EN/CN — pill, border navy, one side primary bg white text, other side transparent navy text.
- Right: "Finish Reading" button — full flex-1, primary bg, white, height 48px, rounded, shadow; serif italic 17px + check icon; active scale 0.98.

---

## 9. Interaction

- **Cards**: `transition transform 0.2s, box-shadow 0.2s`; active `transform scale(0.98)`.
- **Buttons**: `active:opacity-0.7` or `active:scale-[0.98]`.
- **Tap highlight**: `-webkit-tap-highlight-color: transparent` on reading page.

In React Native: use `Pressable`/`TouchableOpacity` with `activeOpacity` or scale animation to match.

---

## 10. Icons

- **Library**: Material Symbols Outlined (variable font wght 100–700, fill 0–1).
- **Sizes**: 18px (controls), 24px (header back, main nav), 2xl for nav (e.g. 24px).
- **Active tab**: use filled variant (fill-1) where applicable.

React Native: use `@expo/vector-icons` MaterialIcons or similar; keep same semantic usage (menu, history, bookmark, calendar_today, check_circle, trending_up, menu_book, auto_stories, person, etc.).

---

## 11. Summary Token Table (for theme constants)

```ts
// System background is unified: use for all screens (MainPage, PassageMain, auth, etc.)
export const designSystemColors = {
  background: '#FDFBFA',  // system page background
  bgCream: '#FDFBFA',
  primary: '#1A2B3C',
  accent: '#8E735B',
  cardBg: '#FFFFFF',
  textMain: '#2C2C2C',
  textMuted: '#6B7280',
  border: '#E5E1D8',
  progressBg: '#F0EDE5',
  newWordUnderline: '#D97706',
  reviewWordBg: '#E8F0E8',
  completedBadgeBg: '#ECFDF5',
  completedBadgeText: '#047857',
};
```

Use this document when implementing or refactoring screens so MainPage and PassageMain align with the reference UI while keeping existing app components and behavior.
