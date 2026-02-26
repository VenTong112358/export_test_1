# VenTong App — Complete User Workflow

**What this app does (short summary)**  
VenTong (仝文馆) is a **reading and vocabulary app** for learners. The app **recommends 5 articles per day**; users set a personal goal (e.g. 1–3 articles to complete). They see today’s learning sessions (each with new and review words), preview words for a session, then read an **AI-generated article** with highlighted vocabulary. In the article they can tap words to look up definitions or take short quizzes, and long-press sentences to translate or analyze. After finishing an article they rate it and see a recap; when they complete today’s goal they get a congratulations popup. The app also offers **history articles**, **saved articles**, **words and level stats**, and **profile/settings** (wordbook, daily goal, phone). This document describes the full user workflow and how each page connects.

---

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  App Launch  │────►│ Auth Check  │────►│  Logged in?      │
└─────────────┘     └─────────────┘     └────┬────────┬─────┘
                                             │ YES    │ NO
                                             ▼        ▼
                                        ┌────────┐ ┌──────────┐
                                        │MainPage│ │ Register │
                                        └────────┘ └──────────┘
```

---

## Flow 1: First-Time User (New Install)

```
App Launch
  │
  ▼
_layout.tsx (AuthWrapper)
  │  • Checks privacy policy acceptance
  │  • Checks auth token & user
  │  • No user/token found
  ▼
┌─────────────────────────────────────┐
│  (auth)/register.tsx                │ ◄── Default screen for new users
│                                     │
│  ┌───────────────────────────────┐  │
│  │  PrivacyPolicyModal (auto)    │  │  Pops up automatically on first use
│  │  • "同意" → close modal,      │  │
│  │    auto-check terms checkbox  │  │
│  │  • "不同意" → exit app        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Form: 用户名 / 密码 / 确认密码 /   │
│        手机号 / 隐私政策勾选        │
│                                     │
│  [发送验证码]  → sms-verification   │
│  [微信注册]    → WeChat auth flow   │
│  "已有账号？去登录" → login.tsx      │
└──────┬──────────┬───────────────────┘
       │          │
       │          │ "已有账号？去登录"
       │          ▼
       │   ┌────────────────────────────┐
       │   │  (auth)/login.tsx          │
       │   │                            │
       │   │  Form: 用户名 / 密码       │
       │   │                            │
       │   │  [登录]                    │
       │   │    • Existing user → MainPage
       │   │  [微信登录]                │
       │   │    • Existing user → MainPage
       │   │    • New user → onboarding │
       │   │  "忘记密码？" → forgot.tsx │
       │   │  "没有账号？去注册" → register
       │   └────────────────────────────┘
       │
       ▼ (发送验证码)
┌─────────────────────────────────────┐
│  (auth)/sms-verification.tsx        │
│                                     │
│  Enter 6-digit SMS code             │
│                                     │
│  • Verify success → onboarding      │
│  • Verify fail → alert, back login  │
│  • Resend code (countdown timer)    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  (auth)/onboarding-wordbook.tsx     │
│                                     │
│  Choose word book:                  │
│  • CET4 / CET6 / IELTS / GRE etc.  │
│                                     │
│  [下一步] → change-daily-goal       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  (settings)/change-daily-goal.tsx   │
│                                     │
│  Choose daily learning goal:        │
│  • 10 / 20 / 30 / 50 words per day │
│                                     │
│  [确认] → calls account_initiation  │
│           API → MainPage            │
└──────────────┬──────────────────────┘
               ▼
         ═══ MainPage ═══
```

---

## Flow 2: Returning User (Has Account)

```
App Launch
  │
  ▼
_layout.tsx (AuthWrapper)
  │  • Restores token & user from AsyncStorage
  │  • Token valid, user exists
  ▼
index.tsx
  │  Redirect → /(tabs)/MainPage
  ▼
═══════════════════════════════════════
║        BOTTOM TAB NAVIGATION        ║
╠═════════════╦═══════════╦═══════════╣
║   MainPage  ║   Words   ║  Profile  ║
║    (阅读)   ║   (单词)  ║   (我的)  ║
╚═════════════╩═══════════╩═══════════╝
```

---

## Flow 3: Daily Reading Flow (Core Loop)

This is the main learning loop that users repeat daily.

```
┌──────────────────────────────────────────┐
│  (tabs)/MainPage.tsx                     │
│                                          │
│  **Daily recommendation:** The app      │
│  recommends **5 articles per day**       │
│  (shown as 5 learning log cards).       │
│  User's **personal goal** (1/2/3 篇)     │
│  is set in settings; progress bar       │
│  tracks completed vs goal.              │
│                                          │
│  ┌─ 今日目标 (top section) ─────────────┐  │
│  │  • "今日目标" + "X篇" (e.g. 2篇)     │  │  User sets goal: 1 / 2 / 3 articles
│  │  • Progress bar (DailyProgressar)    │  │  per day in settings; bar shows
│  │    fills as user completes each      │  │  completed / total (e.g. 1/2).
│  │    article (e.g. 1/2 篇)             │  │
│  │  • [提前完成] button (right of bar)  │  │  Tap → confirmation modal
│  │    Tap → "是否确认提前完成今日学习"   │  │  "是否确认..." → [确认] →
│  │    → [确认] → Congratulations popup  │  │  CongratulationsBottomSheet.
│  └──────────────────────────────────────┘  │
│                                          │
│  Shows:                                  │
│  • **5 recommended articles** (learning │
│    log cards) for today; each card =    │
│    1 article session with new words +  │
│    review words                         │
│  • Quick-access buttons:                 │
│    [历史文章] [收藏文章] [我的笔记]       │
│                                          │
│  Actions:                                │
│  • Tap a log card → WordPreview          │
│  • 历史文章 → history-articles           │
│  • 收藏文章 → SavedArticles              │
│  • 我的笔记 → MyNotes                    │
│  • Top-right dropdown menu               │
│  • When user finishes today's reading   │
│    (all goals done) and returns from     │
│    today-recap → Congratulations popup   │
│    also auto-shows (see Flow 3 recap).   │
└──────────────┬───────────────────────────┘
               │ (Tap a log card)
               ▼
┌──────────────────────────────────────────┐
│  WordPreview (debug/testblank.tsx)        │
│  Component: app/components/WordPreview    │
│                                          │
│  Shows for this session:                 │
│  ┌────────────────────────────────────┐  │
│  │  📗 New Words (生词)               │  │
│  │  • word / phonetic / definition    │  │
│  │  • 🔊 play pronunciation          │  │
│  │  • Tap a word → hide/show its      │  │  Helps user memorize: hide
│  │    Chinese (释义) or English       │  │  meaning or English, recall,
│  │    (word) so user can quiz self    │  │  then tap to reveal.
│  ├────────────────────────────────────┤  │
│  │  📘 Review Words (复习词)          │  │
│  │  • same layout, same tap-to-hide   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ Batch hide/show (two buttons) ─────┐  │
│  │  [隐藏英文] / [显示英文]           │  │  Toggle: hide/show English
│  │  [隐藏中文] / [显示中文]           │  │  (word) for all words.
│  └────────────────────────────────────┘  │  Toggle: hide/show Chinese
│                                          │  (definition) for all words.
│  [开始学习] → PassageMain                │
│  [← Back]  → MainPage                   │
└──────────────┬───────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────┐
│  PassageMain.tsx  ★ THE CORE READING PAGE ★              │
│                                                          │
│  Shows: AI-generated article with word highlights        │
│  • Orange highlight = new words (tap for quiz)           │
│  • Green highlight = review words (tap for definition)   │
│  • Red underline = words already looked up               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Header                                             │  │
│  │ [← Back]  "仝文馆"  [Font/Line-height controls]   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │                                                    │  │
│  │  Article text with highlighted words...            │  │
│  │                                                    │  │
│  │  ┌─ Word Definition Quiz Popup ──────────┐        │  │
│  │  │  (tap orange word → 4 options)        │        │  │
│  │  │  Pick correct Chinese definition      │        │  │
│  │  │  ✓ correct → checkmark → word details │        │  │
│  │  │  ✗ wrong → red highlight              │        │  │
│  │  └───────────────────────────────────────┘        │  │
│  │                                                    │  │
│  │  ┌─ Word Lookup Popup ───────────────────┐        │  │
│  │  │  (tap any non-highlighted word)       │        │  │
│  │  │  Word + phonetic + 🔊 + definition    │        │  │
│  │  └───────────────────────────────────────┘        │  │
│  │                                                    │  │
│  │  ┌─ Sentence Modal (long-press sentence) ┐        │  │
│  │  │  [翻译] [解析] [复制]                  │        │  │
│  │  └───────────────────────────────────────┘        │  │
│  │                                                    │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ [中/英 Toggle]          [完成阅读]                 │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  User interactions:                                      │
│  • Tap orange word → word definition quiz (4 options)    │
│  • Tap green word → direct definition lookup             │
│  • Tap normal word → word lookup popup                   │
│  • Long-press sentence → translate / analyze / copy      │
│  • Toggle 中文/English translation mode                  │
│  • Adjust font size / line height (top-right controls)   │
│  • [完成阅读] → finish reading → article-rate            │
└──────────────┬───────────────────────────────────────────┘
               ▼ (完成阅读)
┌──────────────────────────────────────────┐
│  article-rate.tsx                        │
│                                          │
│  Rate the article quality:               │
│  ★ ★ ★ ★ ★  (star / digit rating)       │
│                                          │
│  [提交评价] → today-recap                │
│  [跳过] (top-right) → today-recap        │
└──────────────┬───────────────────────────┘
               ▼
┌──────────────────────────────────────────┐
│  today-recap.tsx                         │
│                                          │
│  Today's Learning Summary:               │
│  • 📖 Articles completed                 │
│  • 📝 New words learned                  │
│  • 🔄 Words reviewed                     │
│  • 🔥 Current streak                     │
│                                          │
│  [完成] → back to MainPage               │
│                                          │
│  **Finish today's reading:**             │
│  If user has completed all of today's    │
│  goals (e.g. 2/2 篇), when they tap      │
│  [完成], the app sets a flag             │
│  (@show_congrats_on_mainpage). On        │
│  MainPage's next focus, it reads this    │
│  flag and automatically shows the       │
│  **Congratulations popup**              │
│  (CongratulationsBottomSheet), then      │
│  clears the flag. So "完成今日阅读"      │
│  also triggers the same congrats         │
│  experience as "提前完成".               │
└──────────────┬───────────────────────────┘
               ▼
         ═══ MainPage ═══
         (continue with next log, or done for today;
          if all goals done, Congratulations popup shows)
```

### Core Loop Summary

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   MainPage → WordPreview → PassageMain → Rate → Recap         ║
║      ▲                                                  │     ║
║      └──────────────────────────────────────────────────┘     ║
║                                                               ║
║   Repeat for each learning log of the day                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Flow 4: History & Saved Content

```
MainPage
  │
  ├──► history-articles.tsx ─────────────────────────┐
  │    Shows: All past articles (sorted by date)     │
  │    • Status badge: 已完成 / 进行中               │
  │    • New words count, review words count         │
  │    • Sort toggle (ascending / descending)        │
  │    Tap any article ──────────────────────────────►├──► PassageMain
  │                                                  │    (loads from cache
  ├──► SavedArticles.tsx ────────────────────────────┤     or re-generates)
  │    Shows: User's favorited/saved articles        │
  │    Tap any article ──────────────────────────────┘
  │
  ├──► MyNotes.tsx
  │    Shows: User's saved notes
  │
  └──► FavouriteSentences.tsx (via Words tab)
       Shows: User's saved sentences from reading
```

---

## Flow 5: Words Tab

```
═══════════════════════════════
  (tabs)/words.tsx
═══════════════════════════════

  Shows:
  • **Progress & level feedback**
    • LevelBar — user's current level / progress toward next level
    • RadarChart — multi-dimensional learning stats (e.g. vocabulary,
      reading, review performance) so user sees where they stand
  • **Learning statistics**
    • Words learned, articles completed, streaks, etc.
  • **Vocabulary overview**
    • Articles grouped by date; expandable sections with new words
      and reviewed words per article (from local/API data)
  • **Words with Caiji** (if used) — vocabulary analysis / stats

  Actions:
  • [收藏句子] → FavouriteSentences.tsx
    Shows all sentences saved during reading
```

---

## Flow 6: Profile & Settings

```
═══════════════════════════════
  (tabs)/profile.tsx
═══════════════════════════════

  Shows: User info, learning stats

  Actions:
  │
  ├──► (settings)/change-wordbook.tsx
  │    Select a new word book
  │         │
  │         ▼
  │    (settings)/change-daily-goal.tsx
  │    Change daily goal → MainPage
  │
  ├──► (settings)/change-phone.tsx
  │    Change phone number (SMS verification)
  │
  └──► [退出登录] Logout
       Clears auth → (auth)/login.tsx
```

---

## Flow 7: Forgot Password

```
(auth)/login.tsx
  │
  │ "忘记密码？"
  ▼
(auth)/forgot.tsx
  │
  │ Enter phone number → receive reset code
  │ Enter new password → confirm
  ▼
Back to (auth)/login.tsx
```

---

## Gaps: Gamification & Engagement (Design Opportunities)

The app currently has **limited gamification and “fun” engagement** compared to what many learning apps offer. Documenting these gaps helps prioritise future UX/UI work.

**What’s largely missing today:**

- **Streaks & daily rewards**  
  Streak data may exist in the backend, but there is no strong **streak display** (e.g. “连续 7 天”), **daily check-in reward**, or **streak recovery** (e.g. 1 freeze per week).

- **Levels & XP**  
  Beyond LevelBar/RadarChart, there is no clear **level-up system**, **XP per action** (e.g. +10 for finishing an article, +5 per word quiz correct), or **level rewards** (badges, titles, unlockables).

- **Achievements / badges**  
  No **achievement list** (e.g. “读完 10 篇文章”, “连续 3 天完成目标”, “生词测验 10 连对”) or **badges** shown on profile or Words tab.

- **Progress celebration**  
  Congratulations appears on “提前完成” and “完成今日阅读”, but there is little **micro-celebration** (e.g. confetti, sound, animation) after each article or after a word quiz streak.

- **Social / comparison (optional)**  
  No **leaderboards**, **friend activity**, or **group challenges**; everything is single-user.

- **Unlocks & variety**  
  No **themes**, **reading difficulty unlocks**, or **content variety rewards** (e.g. “解锁一篇 GRE 文章”) to keep long-term users engaged.

- **Onboarding “fun”**  
  First-time flow is functional (wordbook + daily goal) but not **playful** (e.g. short intro animation, personality quiz for wordbook, or “first day” special reward).

**Suggested direction for redesign:**  
Treat “gamification & engagement” as a separate pillar in the PRD: define **streaks**, **levels/XP**, **achievements**, and **celebration moments** per screen, then add UI/UX and (if needed) backend support incrementally.

---

## Navigation Map (All Pages)

| Page | Path | Entry From | Exits To |
|------|------|------------|----------|
| **Auth** | | | |
| Register | `(auth)/register` | App launch (new user) | sms-verification, login |
| Login | `(auth)/login` | Register, Profile logout | MainPage, onboarding, forgot |
| SMS Verification | `(auth)/sms-verification` | Register | onboarding-wordbook, login |
| Forgot Password | `(auth)/forgot` | Login | Login |
| Onboarding Wordbook | `(auth)/onboarding-wordbook` | SMS verification, WeChat register | change-daily-goal |
| **Tabs** | | | |
| MainPage | `(tabs)/MainPage` | Login, onboarding, today-recap | WordPreview, history, saved, notes |
| Words | `(tabs)/words` | Tab bar | FavouriteSentences |
| Profile | `(tabs)/profile` | Tab bar | Settings, Login (logout) |
| **Reading Flow** | | | |
| WordPreview | `debug/testblank` | MainPage (tap log) | PassageMain |
| PassageMain | `PassageMain` | WordPreview, history, saved | article-rate, MainPage (back) |
| Article Rate | `article-rate` | PassageMain (完成阅读) | today-recap |
| Today Recap | `today-recap` | article-rate | MainPage |
| **Library** | | | |
| History Articles | `history-articles` | MainPage | PassageMain |
| Saved Articles | `SavedArticles` | MainPage | PassageMain |
| My Notes | `MyNotes` | MainPage | (back) |
| Favourite Sentences | `FavouriteSentences` | Words tab | (back) |
| **Settings** | | | |
| Change Wordbook | `(settings)/change-wordbook` | Profile | change-daily-goal |
| Change Daily Goal | `(settings)/change-daily-goal` | change-wordbook, onboarding | MainPage |
| Change Phone | `(settings)/change-phone` | Profile | (back) |

---

## Key Components Used Across Pages

| Component | Used In | Purpose |
|-----------|---------|---------|
| `Header` | Almost all pages | Back button + title + optional right component |
| `HeaderReadingControls` | PassageMain | Font size & line height adjustment popup |
| `WordPreview` | testblank, word-preview | New/review words list with pronunciation |
| `SentenceSelectionModal` | PassageMain | Translate / analyze / copy sentence |
| `PrivacyPolicyModal` | Register | First-time privacy policy acceptance |
| `CongratulationsBottomSheet` | MainPage | Shows when all daily logs completed |
| `TranslationToggle` | PassageMain | Switch 中文/English translation mode |
| `StarRating` / `DigitRating` | article-rate | Rate article quality |
| `DropdownMenu` | MainPage | Top-right menu options |
| `RadarChart` | Words tab | Visual learning stats |
| `LevelBar` | Words tab | Level progress indicator |
| `DailyProgressar` | MainPage | Daily progress bar |
