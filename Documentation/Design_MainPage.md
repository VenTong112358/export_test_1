# MainPage Layout & Component Design

This document describes the **MainPage** (home / daily reading) layout and how each component should be designed. When implementing, use the encapsulated styles from `constants/recipes.ts`, `constants/theme.ts`, and `designTokens` so the app stays consistent with the design system.

**Design tokens** are defined in `Design_System.md` and `constants/designTokens.ts`. This doc focuses on **layout and component-level specs** for MainPage and which **recipes / theme** to use.

**Copy convention:** All in-app copy is in Chinese except article titles in the Daily Recommendations section, which keep English examples.

---

## 1. Page Structure

| Element | Spec | Encapsulation to Use |
|--------|------|----------------------|
| **Page background** | Full-screen background color | `theme.colors.background` (i.e. designTokensColors.background / #FDFBFA) |
| **Top safe area** | Spacer below status bar / notch | `safeAreaInsets.top` or fixed ~44px |
| **Content horizontal padding** | Left/right padding | `spacing.pageHorizontal` (20) or `spacing.pageHorizontalWide` (24) |
| **Bottom padding** | Space above tab bar | `spacing.bottomNavPaddingBottom` (32) + safe area + tab bar height |

- Main content lives in a **scrollable** container (ScrollView / FlatList).
- Header is **sticky** (stays at top while scrolling).
- Bottom nav is **fixed** at bottom with safe area.

---

## 2. Header (Sticky)

**Role:** Branding + menu entry; always visible.

### 2.1 Layout

- **Container:** Sticky, full width; horizontal: left branding + right menu icon.
- **Padding:** `spacing.headerPaddingHorizontal` (24), `spacing.headerPaddingVertical` (16).
- **Background:** iOS-style blur (blur 20px) + `blur.headerBgRgba` (from designTokens).
- **Border:** 1px bottom, color `theme.colors.border` (c.border).
- **z-index:** Above content (e.g. 50).

### 2.2 Left: Branding

- **Layout:** Vertical, left-aligned.
- **Line 1 (subtitle):**
  - Copy: **「VenTong —— 沉浸语境，词自成章」** (or product slogan).
  - Style: `recipes.auth.subtitle` (10px bold, accent, letter-spacing, etc.).
- **Line 2 (title):**
  - Copy: **「仝文馆」**.
  - Style: `recipes.auth.title`; for full Chinese display add `fontFamily: typography.fontFamily.serifChinese`, same as login/register.

### 2.3 Right: Menu Button & Dropdown

- **Menu trigger:** Icon only (e.g. Material "menu"), 24–32px, color `theme.colors.tint` or `c.primary`, tappable area with padding.
- **Dropdown (when open):**
  - Position: Below trigger, right-aligned, `marginTop` ~12px.
  - Width: ~224px.
  - Background: `c.cardBg` or `theme.colors.surface`, border 1px `c.border`, shadow `shadows.sophisticated`, radius `radius.card` (12px).
  - **Menu items:** Icon + label per row.
    - **历史文章 (History Articles):** icon "history", accent; label serif bold primary, ~14px.
    - **收藏文章 (Saved Articles):** icon "bookmark", accent; same label style.
  - **Footer strip:** Background `c.primary` at ~5% opacity, padding ~`spacing.dropdownFooterPadding` (12), centered label **「档案选择」**, 8px uppercase bold muted (`t.fontSize.archivesLabel` + `c.textMuted`).

---

## 3. Today’s Progress Card

**Role:** Show daily progress (e.g. 2/5 articles) and streak.

### 3.1 Container

- Use **`recipes.card.progress`** (white bg, large radius, border, padding, sophisticated shadow).
- Section margin below: `spacing.sectionVerticalLarge` (40) or equivalent.

### 3.2 Layout (horizontal space-between)

**Left:**

- **Label:** Copy **「今日进度」**. Style: `recipes.sectionHeader.progressLabel` (10px bold, muted, letter-spacing).
- **Big number:** e.g. **「2」**. Style: `t.fontSize.progressNumber` (48), bold, `typography.fontFamily.serif`, `c.primary`.
- **Suffix:** e.g. **「/ 5」**. Style: `t.fontSize.progressOf` (20), serif italic, `c.textMuted`, baseline-aligned with number, gap ~8px.

**Right:**

- **Streak badge:** Row with icon + label. Container: bg `c.bgCream`, border `c.border`, radius `radius.pill`, padding ~12×4; icon accent, small; label **「连续 12 天」**, 10px bold uppercase, `c.primary`.

### 3.3 Progress Bar

- **Track:** **`recipes.progressBar.track`** (height 4px, `c.progressBg`, radius 2px).
- **Fill:** **`recipes.progressBar.fill`** (height 100%, `c.primary`), width from data (e.g. 40%).

### 3.4 Caption Row

- **Layout:** Horizontal space-between, vertically centered.
- **Left quote:** e.g. **「阅读只为心灵提供知识的材料。」**, 11px serif italic, `c.textMuted`.
- **Right percent:** e.g. **「40%」**, 11px bold primary, non-italic.
- Margin above this row: ~16px.

---

## 4. Daily Recommendations Section

**Role:** Section title + list of recommendation cards. **Article titles keep English examples**; all other copy in Chinese.

### 4.1 Section Header Row

- **Layout:** **`recipes.sectionHeader.row`** (horizontal, space-between, bottom border, paddingBottom 12, marginBottom cardGap).
- **Title:** Copy **「每日推荐」**. Style: **`recipes.sectionHeader.title`** (12px bold uppercase, primary, letter-spacing).
- **Date:** e.g. **「2024年10月24日」**. Style: **`recipes.sectionHeader.date`** (10px medium, muted).

### 4.2 Recommendation Cards List

- **Gap between cards:** `spacing.cardGap` (16).
- Card variants: 4.3, 4.4, 4.5.

### 4.3 Recommendation Card — Default (unselected / unread)

- **Container:** **`recipes.card.recommendation`** (white, 1px border, radius 12, shadow).
- **Padding:** `spacing.cardPadding` (20).
- **Top row:** Horizontal space-between, align start, marginBottom 16.
  - **Topic tag:** e.g. 「科学」. Use **`recipes.badge.topicMuted`** + **`recipes.badge.topicMutedText`** (9px uppercase, muted, cream bg, border).
  - **Level badge:** e.g. 「C2」. Use **`recipes.badge.levelAccent`** + **`recipes.badge.levelAccentText`** (9px uppercase, accent).
- **Title:** Article title **in English**, e.g. "The Architectural Legacy of the Renaissance in Modern Urbanism". Style: serif 20px bold, `c.primary`, lineHeight snug; unread can use opacity 0.7.
- **Meta row:** e.g. **「词汇：24 新词」**, dot, **「约 15 分钟」**. 10px uppercase bold muted (`t.fontSize.sectionLabel` + `c.textMuted`).
- **Footer strip (when completed):** **`recipes.card.footerStrip`**, copy e.g. **「已于 08:30 完成」** (10px serif italic muted) + check icon.

### 4.4 Recommendation Card — Current / Selectable (to read)

- Container: **`recipes.card.recommendationActive`** (2px primary border, sophisticated shadow).
- **Topic tag:** Primary bg + white text: **`recipes.badge.topicPrimary`** + **`recipes.badge.topicPrimaryText`** (e.g. 「传播」).
- **Level badge:** **`recipes.badge.levelAccent`**, copy e.g. **「中高级」**.
- **Body:** Optional three-column meta: **「新词」**, **「难度」**, **「预计时间」** (8px uppercase muted labels + 14px bold serif primary values).
- **Primary button:** **`recipes.button.primaryCta`** + **`recipes.button.primaryCtaText`**, copy **「开始阅读」**.

Article title remains in English, e.g. "Semiotics and the Evolution of Digital Communication Symbols".

### 4.5 Recommendation Card — Completed

- Same container as 4.3: **`recipes.card.recommendation`**.
- **Status badge:** **`recipes.badge.completed`** + **`recipes.badge.completedText`**, copy **「已完成」**.
- **Footer strip:** **`recipes.card.footerStrip`**, copy **「已于 … 完成」** + check icon.

Article title example still in English, e.g. "The Architectural Legacy of the Renaissance in Modern Urbanism".

---

## 5. Lexical Mastery Block

**Role:** Big stat (total words) in a primary-colored block.

### 5.1 Container

- **Background:** `c.primary` (#1A2B3C), or theme’s primary.
- **Radius:** `radius.cardLarge` (16).
- **Padding:** ~24px (e.g. `spacing.cardPaddingLarge` 28 or fixed 24).
- **Margin:** top 40 (`spacing.sectionVerticalLarge`), bottom 24 (`spacing.sectionVertical`).
- **Overflow:** hidden (for decorative blur circle); **position:** relative.

### 5.2 Content (z-10)

- **Layout:** Horizontal justify-between, items-end.
- **Left:**
  - **Label:** Copy **「词汇掌握」**. 10px uppercase, letter-spacing 0.2em, bold, white opacity 0.6, marginBottom 8.
  - **Stat:** **「4,820」** — serif 30px bold italic white; then **「词」** — 14px non-serif, opacity 0.8.
- **Right:** Circular icon button, bg white/10, icon "trending_up" white.

### 5.3 Decorative

- Optional: Absolutely positioned large circle (e.g. 128px) bottom-right, bg white/5, blur, full radius, offset -24 -24.

---

## 6. Bottom Navigation (Tab Bar)

**Role:** Five tabs: 阅读 (active), 词汇, 档案, 分析, 我的.

### 6.1 Container

- **Position:** Fixed bottom, full width.
- **Background:** Same blur as header (blur + `blur.headerBgRgba`).
- **Top border:** 1px `theme.colors.border`.
- **Padding:** Horizontal `spacing.headerPaddingHorizontal` (24) or 32; top `spacing.bottomNavPaddingTop` (12); bottom `spacing.bottomNavPaddingBottom` (32) + **safe area bottom**.
- **Layout:** Horizontal justify-between, items-center.
- **z-index:** 50.

### 6.2 Tab Item

- **Layout:** Vertical, center-aligned.
- **Icon:** 24px; active tab **`theme.colors.tabIconSelected`** (or tint), inactive **`theme.colors.tabIconDefault`**.
- **Label:** 9px bold uppercase, letter-spacing, marginTop 4; same color as icon (primary when active, muted when inactive).

### 6.3 Tab Labels & Icons (Chinese)

| Tab | Label | Icon (example) |
|-----|-------|----------------|
| 阅读 | 阅读 | menu_book |
| 词汇 | 词汇 | auto_stories |
| 档案 | 档案 | history_edu |
| 分析 | 分析 | account_balance |
| 我的 | 我的 | person |

---

## 7. Component → Encapsulation Mapping

| Component | Background / Container | Border / Radius | Typography (title/key) | Notes |
|-----------|------------------------|-----------------|------------------------|-------|
| Page background | theme.colors.background | — | — | Bottom padding per spacing |
| Header | Blur + blur.headerBgRgba | 1px bottom theme.colors.border | recipes.auth.subtitle / .title | Sticky, blur |
| Dropdown menu | c.cardBg | 1px, radius.card | 14px serif bold primary | shadows.sophisticated |
| Today’s Progress card | recipes.card.progress | (included) | progressLabel + progressNumber | progressBar recipes |
| Section header row | — | recipes.sectionHeader.row | recipes.sectionHeader.title/date | — |
| Rec. card default | recipes.card.recommendation | (included) | 20px serif bold primary (title in English) | badge.topicMuted / levelAccent |
| Rec. card current | recipes.card.recommendationActive | (included) | Same + button.primaryCta/Text | 开始阅读 |
| Rec. card completed | recipes.card.recommendation + footerStrip | (included) | badge.completed | 已完成 + time |
| Lexical Mastery block | c.primary | radius.cardLarge | 30px serif italic white + 「词」 | Optional blur circle |
| Bottom nav | Blur | 1px top border | 9px bold uppercase | theme tab colors, safe area |

---

## 8. Fonts & Theme Usage

- **Serif:** Matches HTML `serif-font`: `'Playfair Display', 'Noto Serif SC', serif`. In code use `typography.fontFamily.serif` or `serifChinese` (e.g. for 「仝文馆」).
- **Theme colors:** Use **`theme.colors`** for background, border, tint, tabIconSelected, tabIconDefault; exact values from **`constants/designTokens.ts`** `designTokensColors`.
- **Spacing & radius:** Use **`spacing`**, **`radius`**; shadows **`shadows`**; prefer **`recipes`** variants and avoid hardcoded values.

When implementing or refactoring MainPage, use this doc together with `Design_System.md`, `constants/designTokens.ts`, `constants/recipes.ts`, and `constants/theme.ts`.
