Our app currently has ~20 real screens and ~18 shared components. Roughly organized:

# Auth Flow (5 screens):
(auth)/login.tsx — Login
(auth)/register.tsx — Register
(auth)/sms-verification.tsx — SMS code verification
(auth)/onboarding-wordbook.tsx — Choose wordbook
(auth)/onboarding-daily-goal.tsx — Set daily goal
(auth)/forgot.tsx — Password recovery

# Main Tabs (3 screens):
(tabs)/MainPage.tsx — Home/Dashboard
(tabs)/words.tsx — Word list
(tabs)/profile.tsx — User profile

# Core Reading Flow (4 screens):
word-preview.tsx — Word detail preview
PassageMain.tsx — The main reading page (your biggest file ~2800 lines)
article-rate.tsx — Rate article after reading
today-recap.tsx — Daily recap

# Library/History (3 screens):
history-articles.tsx — History articles list
SavedArticles.tsx — Saved/favorited articles
FavouriteSentences.tsx / MyNotes.tsx — Saved sentences & notes

# Settings (3 screens):
(settings)/change-wordbook.tsx
(settings)/change-daily-goal.tsx
(settings)/change-phone.tsx

# Debug/Test (can ignore):
debug/, test-api.tsx, test-saved-sentences.tsx, etc.