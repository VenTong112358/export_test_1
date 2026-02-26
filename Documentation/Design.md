Here is a clean Markdown design system document you can directly use as:

/Design/System_UI_Spec.md


⸻

VenTong UI System Specification

Version 1.0
Last Updated: 2026

⸻

1. Design Philosophy

Brand Keywords
	•	Scholarly
	•	Calm
	•	Premium
	•	Minimal
	•	iOS-inspired blur aesthetic
	•	Structured & intentional

Core Principles
	1.	No arbitrary colors.
	2.	No random font sizes.
	3.	Every UI element must map to a design token.
	4.	Pages assemble components — they do not invent styles.
	5.	Consistency > creativity at the system level.

⸻

2. Design Tokens

Design tokens are the single source of truth for visual consistency.

⸻

2.1 Color Palette

Core Brand Colors

Token	Value	Usage
--primary	#1A2B3C	Titles, active borders, main CTA
--accent	#8E735B	Category labels, highlights
--bg-cream	#FDFBFA	Page background
--card-bg	#FFFFFF	Cards
--text-main	#2C2C2C	Primary text
--text-muted	#6B7280	Secondary text
--border-color	#E5E1D8	Hairline borders
--progress-bg	#F0EDE5	Progress background

Semantic Colors

Purpose	Token
Success	Emerald 700
Warning	Amber 600
Error	Red 600
Info	Blue 600


⸻

2.2 Typography

Font Families
	•	Sans: Inter
	•	Serif (English): Playfair Display
	•	Serif (Chinese): Noto Serif SC

Typography Roles

Role	Font	Size	Weight	Usage
Hero Title	Serif	32–48px	Bold	Key metrics
Section Title	Sans	12px	Bold uppercase	Section headers
Card Title	Serif	20px	Bold	Article title
Meta Label	Sans	8–10px	Bold uppercase	“New Words”
Body	Sans	14–16px	Regular	Paragraph text
Caption	Sans	10–11px	Medium	Footnotes


⸻

2.3 Spacing Scale

Base unit: 4px

Token	Value
space-1	4px
space-2	8px
space-3	12px
space-4	16px
space-5	20px
space-6	24px
space-8	32px


⸻

2.4 Radius Scale

Token	Value
radius-sm	6px
radius-md	12px
radius-lg	16px
radius-xl	20px
radius-2xl	24px


⸻

2.5 Shadow & Effects

Name	Usage
sophisticated-shadow	Elevated cards
ios-blur	Sticky header / bottom nav
tap-scale	Active interaction feedback


⸻

3. Component System

All UI elements must use predefined component patterns.

⸻

3.1 HeaderBar

Purpose

Top brand header with dropdown menu.

Props
	•	title
	•	subtitle
	•	menuItems[]

Variants
	•	Default
	•	With back button
	•	With actions

⸻

3.2 Badge

Props
	•	label
	•	type (category | status | level)

Variants
	•	Category (History, Science, etc.)
	•	Status (Completed, Locked)
	•	Level (B2, C1, C2)

⸻

3.3 RecommendationCard

Purpose

Displays article recommendation.

Props
	•	title
	•	category
	•	difficulty
	•	newWords
	•	estimatedTime
	•	status (completed | available | locked)

States
	•	Default
	•	Completed (green label + check icon)
	•	Active (highlighted border)
	•	Locked (reduced opacity)

Slots
	•	Header badges
	•	Title
	•	Meta row
	•	Footer (timestamp / CTA button)

⸻

3.4 ProgressCard

Props
	•	completedCount
	•	totalCount
	•	streak
	•	quote

Subcomponents
	•	ProgressBar
	•	StreakBadge
	•	PercentageDisplay

⸻

3.5 BottomNav

Props
	•	items[]
	•	activeItem

Rules
	•	Always sticky
	•	Blur background
	•	Minimum 44px tap target

⸻

4. Layout Rules

Page Padding
	•	Mobile: px-5
	•	Section spacing: space-y-6

Card Rules
	•	Border always visible
	•	No floating without shadow
	•	Radius must follow scale

Hierarchy Rule

Label → Title → Meta → CTA

Never invert hierarchy without reason.

⸻

5. Screen Composition

⸻

Screen: Daily Reading Home

Structure
	1.	HeaderBar
	2.	ProgressCard
	3.	SectionHeader (Daily Recommendations)
	4.	RecommendationCard List
	5.	Lexical Mastery Card
	6.	BottomNav

Required Data
	•	User progress
	•	Streak
	•	Recommendations[]
	•	Vocabulary count

⸻

6. State Management Rules

Each screen must define:
	•	Loading state
	•	Empty state
	•	Error state
	•	First-time user state

Never design only the “perfect” state.

⸻

7. Folder Structure Convention

/components/ui/          → primitive components
/components/blocks/      → complex reusable blocks
/screens/                → page composition
/design/design.ts        → tokens & style recipes
/design/System_UI_Spec.md


⸻

8. Naming Convention
	•	UI roles > visual names
Example:
❌ bigBlueCard
✅ RecommendationCardActive
	•	Semantic class mapping only via design tokens.

⸻

9. Non-Negotiable Rules
	1.	No inline magic numbers.
	2.	No direct hex colors in components.
	3.	All typography must map to role.
	4.	Every new component must be documented here.

⸻

If you want next, I can also generate:
	•	design.ts starter structure
	•	or convert this into a Notion-ready system
	•	or refactor it into React Native-compatible design spec

Just tell me which stack you’re using next.