# Finly Streak & Achievement System — Design Specification

**Date:** 2026-05-13
**Project:** Finly Personal Finance Tracker
**Feature:** Streak & Achievement System

---

## Overview

A streak and achievement system to increase user engagement and financial wellness through gamification. Based on user selection from visual companion, we'll implement:

1. **Daily Streak Counter** - Shows consecutive days of logging transactions
2. **Achievement Badges** - Earn badges for financial milestones  
3. **Weekly Challenges** - Rotating challenges with rewards

All features will be client-side only, using localStorage for persistence.

---

## Core Concepts

### Streak System
- A streak is incremented when user logs at least one transaction per day
- Streak resets to 0 if no transactions logged for a full day
- Maximum tracked streak: 365 days (1 year)
- Streak displayed prominently in Dashboard

### Achievement System
- Achievements are unlocked when specific conditions are met
- Each achievement has: icon, title, description, unlock date
- Achievements persist in localStorage
- Displayed in a dedicated Achievements section (accessible from Goals tab)

### Weekly Challenge System
- New challenge appears every Monday
- Challenges expire Sunday at 11:59 PM
- Completed challenges award points toward streak multipliers
- Points can unlock streak bonuses (e.g., 2x streak after 500 points)

---

## Data Models

### Streak Data (localStorage key: `ft.streak`)
```js
{
  lastActiveDate: "2026-05-10", // YYYY-MM-DD of last transaction logged
  currentStreak: 7,
  longestStreak: 15,
  challengePoints: 240, // points earned from weekly challenges
  lastChallengeReset: "2026-05-08" // last Monday
}
```

### Achievements Data (localStorage key: `ft.achievements`)
```js
[
  {
    id: "first-transaction",
    title: "First Steps",
    description: "Logged your first transaction",
    icon: "💰",
    unlockedAt: "2026-05-01T10:30:00Z",
    category: "milestone"
  },
  {
    id: "week-streak",
    title: "Week Warrior",
    description: "Maintained a 7-day streak",
    icon: "🔥",
    unlockedAt: "2026-05-08T14:22:00Z",
    category: "streak"
  }
]
```

### Weekly Challenges Data (localStorage key: `ft.weeklyChallenges`)
```js
{
  activeChallenge: {
    id: "no-spend-weekend",
    title: "No Spend Weekend",
    description: "Save $50 by avoiding discretionary spending Sat-Sun",
    reward: 50, // points
    startDate: "2026-05-10",
    endDate: "2026-05-12"
  },
  completedChallenges: [
    {
      id: "meal-prep-monday",
      completedAt: "2026-05-06T19:45:00Z",
      reward: 30
    }
  ]
}
```

---

## Feature Details

### 1. Daily Streak Counter (Dashboard)
**Location:** Dashboard page, prominent position
**UI:** Large number with fire icon, label, progress bar to next milestone
**Behavior:**
- Updates when user logs first transaction of the day
- Shows current streak (e.g., "7")
- Subtext: "Daily Streak" + "Log transactions 7 days in a row"
- Visual progress bar to next streak milestone (at 7, 14, 30, 60, 100 days)
- Tooltip on hover showing longest streak

### 2. Achievement Badges
**Location:** Achievements section (new tab under Goals or modal)
**UI:** Grid of badge cards (3-4 columns)
**Badge States:**
- **Unlocked:** Full color, visible icon/title/description/unlock date
- **Locked:** Silhouette/icon, hidden title, "???" description, lock icon
**Behavior:**
- Check achievement conditions on app load and after relevant actions
- Show toast "New achievement unlocked!" when earned
- Animations: badge pops in when unlocked

### 3. Weekly Challenges
**Location:** Dashboard (below streak counter) or dedicated Challenges tab
**UI:** Card with challenge title, description, reward, progress indicator, accept/complete buttons
**Behavior:**
- New challenge fetched every Monday
- User must explicitly "Accept" challenge to start tracking
- Progress tracked automatically (e.g., spending in certain categories)
- On completion: award points, show completion animation
- Expired challenges move to completed list

### 4. Integration Points
**Dashboard:**
- Streak counter prominently displayed
- Weekly challenge card (if accepted)
- Link to view all achievements

**Goals Tab:**
- New "Achievements" sub-tab
- Shows achievement grid with filters (all, unlocked, locked, by category)

**Transaction Logging:**
- Check for streak increment on first transaction of day
- Check for achievement unlock conditions
- Check for weekly challenge progress

**Settings:**
- Toggle to enable/disable gamification features
- Option to hide streak/counter if preferred

---

## Technical Implementation

### State Management
- Extend existing `useLocalStorage` hook or create new hooks:
  - `useStreak()`
  - `useAchievements()`  
  - `useWeeklyChallenges()`

### Components to Create/Modify
- `src/components/StreakCounter.jsx` - displays streak with fire icon
- `src/components/AchievementBadge.jsx` - individual badge component
- `src/components/AchievementGrid.jsx` - grid of achievements
- `src/components/WeeklyChallengeCard.jsx` - challenge display
- `src/components/AchievementsPage.jsx` - full achievements page
- Modify `src/pages/Dashboard.jsx` - add streak counter and challenge card
- Modify `src/pages/Goals.jsx` - add Achievements tab
- Modify `src/pages/Settings.jsx` - add gamification toggles
- Create `src/lib/streak.js`, `src/lib/achievements.js`, `src/lib/weeklyChallenges.js` - logic helpers

### Persistence Strategy
- All data stored in localStorage under prefixed keys
- Initialize from localStorage on app load with lazy initializer
- Sync back to localStorage via useEffect whenever data changes
- Handle private browsing mode gracefully (try/catch)

### Performance Considerations
- Streak check: O(1) - just compare dates
- Achievement check: O(n) where n = number of achievements (typically < 50)
- Weekly challenge progress: O(1) for most, O(m) for category-based where m = transactions in period
- All checks run on transaction add/update and app load

### Edge Cases & Error Handling
- **Private browsing:** Disable features gracefully, show tooltip explaining why
- **System time changes:** Use relative day counting, not absolute dates where possible
- **Data corruption:** Validate localStorage structure, reset to defaults if invalid
- **Timezones:** Store dates in ISO format, compare using UTC to avoid timezone issues
- **First launch:** Initialize with default values (streak=0, no achievements)

---

## User Flows

### First Time User
1. Opens app, sees streak counter at "0"
2. Logs first transaction → streak becomes "1", First Transaction achievement unlocked
3. Sees toast: "New achievement unlocked! First Steps"
4. Next day, logs transaction → streak becomes "2"
5. Misses a day → streak resets to "0"

### Active User
1. Sees streak counter showing current count
2. Sees weekly challenge card in Dashboard, accepts challenge
3. Logs transactions that contribute to challenge progress
4. Sees progress bar fill on weekly challenge card
5. Completes challenge → gets points, sees completion animation
6. Points accumulate toward streak multiplier unlock

### Achievement Hunter
1. Navigates to Goals → Achievements tab
2. Sees grid of locked/unlocked achievements
3. Clicks on locked achievement to see requirements
4. Adjusts behavior to meet achievement conditions
5. Earns achievement → sees celebration animation

---

## Dependencies & Integration

### Uses Existing:
- `useLocalStorage` hook pattern
- `formatMoney`, `prettyDate` utilities
- `categoryMeta` for transaction categorization
- Existing toast system for achievement notifications
- Existing card/styling patterns

### Adds:
- New localStorage keys: `ft.streak`, `ft.achievements`, `ft.weeklyChallenges`
- New components: StreakCounter, AchievementBadge, etc.
- New utility modules for streak/achievement/challenge logic
- New styling for achievement badges, streak counter

### Compatible With:
- Current tab-based routing system
- Existing transaction logging flow
- Recurring transactions (count toward streak if logged)
- Goals system (separate but complementary)
- Reports (streak data could be included in future)

---

## Success Metrics & Evaluation

### Engagement Metrics
- Daily active users (streak encourages daily opens)
- Streak adoption rate (% of users with streak > 0)
- Achievement completion rate
- Weekly challenge participation rate

### Financial Wellness Metrics
- Correlation between streak length and savings rate
- Achievement unlock rate for positive financial behaviors
- User-reported satisfaction (via optional survey)

### Technical Metrics
- Feature initialization time (< 100ms)
- LocalStorage usage (< 50KB)
- Error rate in streak/achievement calculation

---

## Future Extensions

### Phase 2 Ideas
- **Streak Freezes:** Earn ability to pause streak once per month
- **Streak Multipliers:** 2x streak points after earning 1000 challenge points
- **Friend Comparison:** Anonymized streak leaderboards (opt-in)
- **Custom Challenges:** User-created challenges with custom rewards
- **Streak History:** Calendar view showing streaks over time

### Achievement Categories
- **Milestone:** Firsts and round numbers (first transaction, $1k saved)
- **Streak:** Consecutive day achievements (3-day, 7-day, 30-day streaks)
- **Budget:** Spending control achievements (under budget X days)
- **Savings:** Goal achievement and emergency fund milestones
- **Consistency:** Regular income/expense logging patterns
- **Education:** Completing financial literacy content (if added)

### Challenge Types
- **Spending:** Reduce spending in specific categories
- **Saving:** Increase savings rate or emergency fund
- **Income:** Log additional income sources
- **Habit:** Regular behaviors (log expenses before 9 PM, review budget weekly)
- **Learning:** Complete educational modules
- **Social:** Share anonymized milestones (future feature)

---

## Open Questions & Decisions

### Streak Definition
- Should streak count only days with expenses, or any transaction (including income)?
  - **Decision:** Any transaction counts (more inclusive, encourages regular logging)

### Achievement Visibility
- Should locked achievements be visible (tease what's coming) or hidden (pure surprise)?
  - **Decision:** Visible but obscured (silhouette + locked icon) to motivate

### Challenge Difficulty
- Should challenges be personalized based on user's spending/saving patterns?
  - **Decision:** Start with generic challenges, consider personalization in Phase 2

### Notification Strategy
- How aggressive should achievement/toast notifications be?
  - **Decision:** Subtle toast for achievements, no sound, dismissible

### Data Export
- Should streak/achievement data be included in backup/export?
  - **Decision:** Yes, include all ft.* localStorage keys in backup

---

## Implementation Order

1. **Streak Counter** - foundation, most visible feature
2. **Achievement System** - core engagement loop  
3. **Weekly Challenges** - ongoing engagement mechanic
4. **Integration & Polish** - connect to existing systems, add animations
5. **Settings & Preferences** - user control over features
6. **Testing & Validation** - ensure reliability across edge cases

Each phase should be testable independently and provide user value.
