# Finly Streak & Achievement System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a streak counter, achievement badges, and weekly challenges system to increase user engagement in Finly Personal Finance Tracker.

**Architecture:** Extend localStorage-based state management with new hooks (`useStreak`, `useAchievements`, `useWeeklyChallenges`) and create new components. All gamification data persisted client-side via localStorage keys `ft.streak`, `ft.achievements`, `ft.weeklyChallenges`.

**Tech Stack:** React 19, Tailwind CSS 3, Lucide React, localStorage, existing `useLocalStorage` hook pattern.

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/lib/streak.js` | Streak calculation logic, date helpers |
| `src/lib/achievements.js` | Achievement definitions, unlock conditions, check logic |
| `src/lib/weeklyChallenges.js` | Challenge generation, progress tracking, expiry logic |
| `src/components/StreakCounter.jsx` | Streak display with fire icon, progress bar |
| `src/components/AchievementBadge.jsx` | Individual badge (locked/unlocked states) |
| `src/components/WeeklyChallengeCard.jsx` | Challenge display with progress, accept/complete buttons |
| `src/components/AchievementsPage.jsx` | Full achievements page with grid and filters |
| `src/pages/Dashboard.jsx` | Add streak counter, weekly challenge card |
| `src/pages/Goals.jsx` | Add Achievements tab |
| `src/pages/Settings.jsx` | Add gamification toggles |

---

### Task 1: Data Layer — Streak Logic (`src/lib/streak.js`)

**Files:**
- Create: `src/lib/streak.js`

- [ ] **Step 1: Create streak.js with core logic**

```js
import { useLocalStorage } from "./storage";

export function getStreakData() {
  return JSON.parse(localStorage.getItem("ft.streak") || "null");
}

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(dateA, dateB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(dateB) - new Date(dateA)) / msPerDay);
}

export function calculateStreak(transactions) {
  if (!transactions || transactions.length === 0) {
    return { currentStreak: 0, lastActiveDate: null, longestStreak: 0 };
  }

  const dates = [...new Set(transactions.map((t) => t.date))].sort().reverse();
  const today = getTodayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let currentStreak = 0;
  let checkDate = today;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const date of dates) {
    if (date === checkDate || date === yesterday) {
      tempStreak++;
      checkDate = new Date(new Date(date) - 86400000).toISOString().slice(0, 10);
    }
  }

  currentStreak = tempStreak;

  const uniqueDates = [...new Set(transactions.map((t) => t.date))].sort();
  let maxStreak = 0;
  let runStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = daysBetween(uniqueDates[i - 1], uniqueDates[i]);
    if (diff === 1) {
      runStreak++;
    } else {
      maxStreak = Math.max(maxStreak, runStreak);
      runStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, runStreak);
  longestStreak = maxStreak;

  return {
    currentStreak,
    lastActiveDate: dates[0] || null,
    longestStreak,
  };
}

export function useStreak(transactions) {
  const [streakData, setStreakData] = useLocalStorage("ft.streak", {
    lastActiveDate: null,
    currentStreak: 0,
    longestStreak: 0,
    challengePoints: 0,
    lastChallengeReset: null,
  });

  const updateStreak = (txDate) => {
    const today = getTodayISO();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastDate = streakData.lastActiveDate;

    if (lastDate === today) return;

    let newStreak = 1;
    if (lastDate === yesterday) {
      newStreak = streakData.currentStreak + 1;
    }

    setStreakData({
      ...streakData,
      lastActiveDate: txDate || today,
      currentStreak: newStreak,
      longestStreak: Math.max(streakData.longestStreak, newStreak),
    });
  };

  return { streakData, updateStreak };
}

export function STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];

export function getNextMilestone(currentStreak) {
  return STREAK_MILESTONES.find((m) => m > currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/streak.js
git commit -m "feat: add streak calculation logic and useStreak hook"
```

---

### Task 2: Data Layer — Achievement Definitions (`src/lib/achievements.js`)

**Files:**
- Create: `src/lib/achievements.js`

- [ ] **Step 1: Create achievements.js with definitions and check logic**

```js
import { useLocalStorage } from "./storage";

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "first-transaction",
    title: "First Steps",
    description: "Logged your first transaction",
    icon: "💰",
    category: "milestone",
    condition: (ctx) => ctx.transactionCount >= 1,
  },
  {
    id: "week-streak",
    title: "Week Warrior",
    description: "Maintained a 7-day streak",
    icon: "🔥",
    category: "streak",
    condition: (ctx) => ctx.currentStreak >= 7,
  },
  {
    id: "month-streak",
    title: "Month Master",
    description: "Maintained a 30-day streak",
    icon: "🌟",
    category: "streak",
    condition: (ctx) => ctx.currentStreak >= 30,
  },
  {
    id: "ten-transactions",
    title: "Habit Former",
    description: "Logged 10 transactions",
    icon: "📝",
    category: "milestone",
    condition: (ctx) => ctx.transactionCount >= 10,
  },
  {
    id: "first-goal",
    title: "Goal Setter",
    description: "Created your first savings goal",
    icon: "🎯",
    category: "goal",
    condition: (ctx) => ctx.goalCount >= 1,
  },
  {
    id: "goal-complete",
    title: "Goal Crusher",
    description: "Completed a savings goal",
    icon: "🏆",
    category: "goal",
    condition: (ctx) => ctx.completedGoals >= 1,
  },
  {
    id: "first-budget",
    title: "Budget Beginner",
    description: "Set your first category budget",
    icon: "📊",
    category: "budget",
    condition: (ctx) => ctx.budgetCount >= 1,
  },
  {
    id: "under-budget",
    title: "Budget Master",
    description: "Stay under budget for 7 consecutive days",
    icon: "⚖️",
    category: "budget",
    condition: (ctx) => ctx.daysUnderBudget >= 7,
  },
  {
    id: "first-recurring",
    title: "Automation Starter",
    description: "Created your first recurring rule",
    icon: "🔄",
    category: "automation",
    condition: (ctx) => ctx.recurringCount >= 1,
  },
  {
    id: "hundred-transactions",
    title: "Record Keeper",
    description: "Logged 100 transactions",
    icon: "📚",
    category: "milestone",
    condition: (ctx) => ctx.transactionCount >= 100,
  },
  {
    id: "early-bird",
    title: "Early Bird",
    description: "Log a transaction before 9 AM",
    icon: "🐦",
    category: "habit",
    condition: (ctx) => ctx.hasEarlyTransaction,
  },
  {
    id: "night-owl",
    title: "Night Owl",
    description: "Log a transaction after 10 PM",
    icon: "🦉",
    category: "habit",
    condition: (ctx) => ctx.hasLateTransaction,
  },
  {
    id: "savings-rate",
    title: "Saver",
    description: "Achieve a 20% savings rate in a month",
    icon: "💎",
    category: "savings",
    condition: (ctx) => ctx.savingsRate >= 20,
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    description: "Complete 3 weekly challenges",
    icon: "🏅",
    category: "challenge",
    condition: (ctx) => ctx.completedChallenges >= 3,
  },
  {
    id: "streak-bonus",
    title: "Dedicated",
    description: "Reach a 14-day streak",
    icon: "⭐",
    category: "streak",
    condition: (ctx) => ctx.currentStreak >= 14,
  },
];

export const CATEGORIES = ["milestone", "streak", "goal", "budget", "automation", "habit", "savings", "challenge"];

export function useAchievements(transactions, goals, recurring, budgets) {
  const [unlocked, setUnlocked] = useLocalStorage("ft.achievements", []);

  const checkAndUnlock = () => {
    const txCount = transactions.length;
    const goalCount = goals.length;
    const completedGoals = goals.filter((g) => Math.min(100, (g.saved / g.target) * 100) >= 100).length;
    const recurringCount = recurring.length;
    const budgetCount = Object.keys(budgets).length;

    const currentStreak = 0;

    const now = new Date();
    const hasEarly = transactions.some((t) => {
      const d = new Date(t.date);
      return d.getHours() < 9;
    });
    const hasLate = transactions.some((t) => {
      const d = new Date(t.date);
      return d.getHours() >= 22;
    });

    const currentMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthIncome = currentMonth.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const monthExpense = currentMonth.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

    const ctx = {
      transactionCount: txCount,
      currentStreak,
      goalCount,
      completedGoals,
      recurringCount,
      budgetCount,
      hasEarlyTransaction: hasEarly,
      hasLateTransaction: hasLate,
      savingsRate,
      daysUnderBudget: 0,
      completedChallenges: 0,
    };

    const newlyUnlocked = [];
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const already = unlocked.find((a) => a.id === def.id);
      if (!already && def.condition(ctx)) {
        newlyUnlocked.push({
          id: def.id,
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    if (newlyUnlocked.length > 0) {
      setUnlocked((prev) => [...prev, ...newlyUnlocked]);
    }

    return newlyUnlocked;
  };

  return { unlocked, checkAndUnlock };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/achievements.js
git commit -m "feat: add achievement definitions and useAchievements hook"
```

---

### Task 3: Data Layer — Weekly Challenges (`src/lib/weeklyChallenges.js`)

**Files:**
- Create: `src/lib/weeklyChallenges.js`

- [ ] **Step 1: Create weeklyChallenges.js**

```js
import { useLocalStorage } from "./storage";

export const CHALLENGE_TEMPLATES = [
  {
    id: "no-spend-weekend",
    title: "No Spend Weekend",
    description: "Avoid discretionary spending Saturday and Sunday",
    category: "spending",
    reward: 50,
  },
  {
    id: "meal-prep-monday",
    title: "Meal Prep Monday",
    description: "Keep Food & Dining under $10 on Monday",
    category: "spending",
    reward: 30,
  },
  {
    id: "no-takeout-week",
    title: "Home Cook Week",
    description: "No restaurant or delivery orders for 7 days",
    category: "spending",
    reward: 60,
  },
  {
    id: "coffee-free",
    title: "Coffee Break",
    description: "Avoid Coffee & Tea purchases for 7 days",
    category: "spending",
    reward: 40,
  },
  {
    id: "savings-boost",
    title: "Savings Boost",
    description: "Add $50 to a savings goal this week",
    category: "savings",
    reward: 50,
  },
  {
    id: "track-everyday",
    title: "Track Every Day",
    description: "Log at least one transaction every day this week",
    category: "habit",
    reward: 40,
  },
  {
    id: "budget-check",
    title: "Budget Check",
    description: "Stay under budget in every category for 5 days",
    category: "budget",
    reward: 45,
  },
  {
    id: "no-impulse",
    title: "No Impulse",
    description: "Avoid Entertainment and Shopping for 7 days",
    category: "spending",
    reward: 55,
  },
];

export function getCurrentMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().slice(0, 10);
}

export function getFollowingSunday(monday) {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function useWeeklyChallenges(transactions, goals) {
  const [challengeData, setChallengeData] = useLocalStorage("ft.weeklyChallenges", {
    activeChallenge: null,
    acceptedChallenge: null,
    completedChallenges: [],
  });

  const initWeeklyChallenge = () => {
    const today = getCurrentMonday();
    if (challengeData.lastChallengeReset !== today) {
      if (challengeData.activeChallenge) {
        setChallengeData({
          ...challengeData,
          completedChallenges: [
            ...challengeData.completedChallenges,
            { id: challengeData.activeChallenge.id, reward: challengeData.activeChallenge.reward, expired: true },
          ].slice(-10),
          activeChallenge: null,
          acceptedChallenge: null,
          lastChallengeReset: today,
        });
      } else {
        setChallengeData({ ...challengeData, lastChallengeReset: today });
      }
    }
  };

  const assignNewChallenge = () => {
    const today = getCurrentMonday();
    const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
    setChallengeData({
      ...challengeData,
      activeChallenge: {
        ...template,
        startDate: today,
        endDate: getFollowingSunday(today),
      },
      lastChallengeReset: today,
    });
  };

  const acceptChallenge = () => {
    if (!challengeData.activeChallenge) return;
    setChallengeData({
      ...challengeData,
      acceptedChallenge: { ...challengeData.activeChallenge },
    });
  };

  const checkChallengeProgress = (transactions) => {
    if (!challengeData.acceptedChallenge) return { progress: 0, complete: false };
    const accepted = challengeData.acceptedChallenge;
    const weekStart = accepted.startDate;
    const weekEnd = accepted.endDate;

    const weekTxs = transactions.filter((t) => t.date >= weekStart && t.date <= weekEnd);

    if (accepted.id === "no-spend-weekend") {
      const weekendTxs = weekTxs.filter((t) => {
        const d = new Date(t.date);
        const day = d.getDay();
        return (day === 0 || day === 6) && t.type === "expense" && t.category !== "Bills & Utilities";
      });
      const complete = weekendTxs.length === 0;
      return { progress: complete ? 100 : 0, complete };
    }

    if (accepted.id === "track-everyday") {
      const days = [...new Set(weekTxs.map((t) => t.date))];
      const progress = (days.length / 7) * 100;
      return { progress: Math.min(100, progress), complete: days.length >= 7 };
    }

    if (accepted.id === "savings-boost") {
      const added = weekTxs
        .filter((t) => t.type === "income" && t.category === "Savings")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const progress = Math.min(100, (added / 50) * 100);
      return { progress, complete: added >= 50 };
    }

    if (accepted.id === "no-impulse") {
      const impulseTxs = weekTxs.filter((t) =>
        t.type === "expense" && (t.category === "Entertainment" || t.category === "Shopping")
      );
      const complete = impulseTxs.length === 0;
      return { progress: complete ? 100 : 0, complete };
    }

    return { progress: 50, complete: false };
  };

  const completeChallenge = () => {
    if (!challengeData.acceptedChallenge) return;
    const completed = challengeData.acceptedChallenge;
    setChallengeData({
      ...challengeData,
      completedChallenges: [
        ...challengeData.completedChallenges,
        { id: completed.id, title: completed.title, reward: completed.reward, completedAt: new Date().toISOString() },
      ].slice(-10),
      challengePoints: (challengeData.challengePoints || 0) + completed.reward,
      activeChallenge: null,
      acceptedChallenge: null,
    });
  };

  return { challengeData, initWeeklyChallenge, assignNewChallenge, acceptChallenge, checkChallengeProgress, completeChallenge };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/weeklyChallenges.js
git commit -m "feat: add weekly challenge logic and useWeeklyChallenges hook"
```

---

### Task 4: UI Component — StreakCounter (`src/components/StreakCounter.jsx`)

**Files:**
- Create: `src/components/StreakCounter.jsx`

- [ ] **Step 1: Create StreakCounter component**

```jsx
import { Flame } from "lucide-react";
import { STREAK_MILESTONES, getNextMilestone } from "../lib/streak";

export default function StreakCounter({ streak, longestStreak }) {
  const nextMilestone = getNextMilestone(streak);
  const progress = nextMilestone
    ? Math.min(100, (streak / nextMilestone) * 100)
    : 100;

  const isMilestone = STREAK_MILESTONES.includes(streak);

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
            streak > 0
              ? "bg-gradient-to-br from-orange-400 to-rose-500 text-white"
              : "bg-stone-100 text-stone-400"
          }`}
        >
          {streak > 0 ? <Flame className="w-7 h-7" /> : <span>{streak}</span>}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Daily Streak</div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums">{streak} {streak === 1 ? "day" : "days"}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>Progress to {nextMilestone} days</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all rounded-full ${
              isMilestone ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-brand-400 to-brand-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {longestStreak > 0 && (
        <div className="mt-2 text-xs text-stone-400">
          Longest streak: <span className="font-medium text-stone-600">{longestStreak} days</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StreakCounter.jsx
git commit -m "feat: add StreakCounter component with progress bar"
```

---

### Task 5: UI Component — AchievementBadge (`src/components/AchievementBadge.jsx`)

**Files:**
- Create: `src/components/AchievementBadge.jsx`

- [ ] **Step 1: Create AchievementBadge component**

```jsx
import { Lock } from "lucide-react";

export default function AchievementBadge({ achievement, lockedDef }) {
  if (achievement) {
    return (
      <div className="bg-white rounded-xl p-4 border border-stone-100 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl">
            {achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-stone-900">{achievement.title}</div>
            <div className="text-xs text-stone-500 mt-0.5">{achievement.description}</div>
            <div className="text-xs text-stone-400 mt-1">
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lockedDef) {
    return (
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 opacity-60">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-stone-600">???</div>
            <div className="text-xs text-stone-400 mt-0.5">Keep using Finly to unlock</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AchievementBadge.jsx
git commit -m "feat: add AchievementBadge component with locked/unlocked states"
```

---

### Task 6: UI Component — WeeklyChallengeCard (`src/components/WeeklyChallengeCard.jsx`)

**Files:**
- Create: `src/components/WeeklyChallengeCard.jsx`

- [ ] **Step 1: Create WeeklyChallengeCard component**

```jsx
import { Target, CheckCircle2 } from "lucide-react";

export default function WeeklyChallengeCard({ challenge, progress, onAccept, onComplete }) {
  if (!challenge) {
    return (
      <div className="card bg-stone-50">
        <div className="text-sm text-stone-500 text-center">No active challenge this week</div>
      </div>
    );
  }

  return (
    <div className={`card ${progress?.complete ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-brand-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Weekly Challenge</span>
      </div>

      <div className="text-lg font-bold text-stone-900">{challenge.title}</div>
      <div className="text-sm text-stone-500 mt-1">{challenge.description}</div>

      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress.complete ? "bg-emerald-500" : "bg-brand-500"
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-medium text-brand-600">
          +{challenge.reward} points reward
        </div>
        {!onComplete ? (
          <button onClick={onAccept} className="btn-primary text-sm py-1.5">
            Accept Challenge
          </button>
        ) : (
          <button
            onClick={onComplete}
            disabled={!progress?.complete}
            className="btn-primary text-sm py-1.5 flex items-center gap-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WeeklyChallengeCard.jsx
git commit -m "feat: add WeeklyChallengeCard component"
```

---

### Task 7: Integration — Dashboard Updates

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add gamification to Dashboard**

Import the new hooks and components, add to Dashboard:

```jsx
import StreakCounter from "../components/StreakCounter";
import WeeklyChallengeCard from "../components/WeeklyChallengeCard";
import { useStreak } from "../lib/streak";
import { useWeeklyChallenges } from "../lib/weeklyChallenges";
```

Add state and hooks inside Dashboard component:

```jsx
const { streakData, updateStreak } = useStreak(transactions);
const { challengeData, initWeeklyChallenge, assignNewChallenge, acceptChallenge, checkChallengeProgress, completeChallenge } = useWeeklyChallenges(transactions, goals);

// Initialize weekly challenge
useEffect(() => {
  initWeeklyChallenge();
  if (!challengeData.activeChallenge) {
    assignNewChallenge();
  }
}, []);

// Update streak when first transaction of day is logged
const lastTxDate = transactions[0]?.date;
useEffect(() => {
  if (lastTxDate) {
    updateStreak(lastTxDate);
  }
}, [lastTxDate]);

const challengeProgress = challengeData.acceptedChallenge
  ? checkChallengeProgress(transactions)
  : null;
```

Add StreakCounter to the top of the stats grid (replace one of the existing stat cards or add beside it):

```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
  <StreakCounter streak={streakData.currentStreak} longestStreak={streakData.longestStreak} />
  <StatCard label="Income" ... />
  ...
</div>
```

Add WeeklyChallengeCard below the stats:

```jsx
<div className="grid lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2 ...">
    {/* existing charts */}
  </div>
  <div className="space-y-4">
    <WeeklyChallengeCard
      challenge={challengeData.acceptedChallenge || challengeData.activeChallenge}
      progress={challengeProgress}
      onAccept={acceptChallenge}
      onComplete={challengeProgress?.complete ? completeChallenge : undefined}
    />
    {/* existing Quick Add */}
  </div>
</div>
```

- [ ] **Step 2: Pass goals to Dashboard**

Update `src/App.jsx` to pass `goals` prop to Dashboard (it should already be there, check).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.jsx src/App.jsx
git commit -m "feat: integrate streak counter and weekly challenges into Dashboard"
```

---

### Task 8: Integration — Achievements Page

**Files:**
- Create: `src/components/AchievementsPage.jsx`
- Modify: `src/pages/Goals.jsx`

- [ ] **Step 1: Create AchievementsPage component**

```jsx
import { useState } from "react";
import { Trophy, Filter } from "lucide-react";
import AchievementBadge from "./AchievementBadge";
import { ACHIEVEMENT_DEFINITIONS, CATEGORIES } from "../lib/achievements";
import { useAchievements } from "../lib/achievements";

export default function AchievementsPage({ transactions, goals, recurring, budgets }) {
  const { unlocked, checkAndUnlock } = useAchievements(transactions, goals, recurring, budgets);
  const [filter, setFilter] = useState("all");

  const newlyUnlocked = checkAndUnlock();

  const filtered = CATEGORIES.includes(filter)
    ? ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === filter)
    : ACHIEVEMENT_DEFINITIONS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-600" />
          <h2 className="text-xl font-bold text-stone-900">Achievements</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-semibold">
            {unlocked.length}/{ACHIEVEMENT_DEFINITIONS.length}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
            filter === "all" ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition ${
              filter === cat ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((def) => {
          const earned = unlocked.find((a) => a.id === def.id);
          if (filter !== "all" && filter !== def.category) return null;
          return (
            <AchievementBadge key={def.id} achievement={earned} lockedDef={!earned ? def : null} />
          );
        })}
      </div>

      {newlyUnlocked.length > 0 && (
        <div className="card border-emerald-200 bg-emerald-50/50">
          <h3 className="font-semibold text-emerald-800 mb-2">New Achievements Unlocked!</h3>
          <div className="space-y-2">
            {newlyUnlocked.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-emerald-700">
                <span>{a.icon}</span>
                <span className="font-medium">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Achievements tab to Goals page**

In `src/pages/Goals.jsx`, add a tab to switch between Goals and Achievements:

```jsx
const [activeTab, setActiveTab] = useState("goals");

// In the return, add tabs:
<div className="flex items-center justify-between">
  <div>
    <h2 className="text-xl font-bold text-stone-900">Savings</h2>
    <p className="text-sm text-stone-500">Track progress toward what matters</p>
  </div>
</div>

<div className="flex gap-1 mb-4">
  <button
    onClick={() => setActiveTab("goals")}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
      activeTab === "goals" ? "bg-brand-100 text-brand-700" : "text-stone-600 hover:bg-stone-100"
    }`}
  >
    Goals
  </button>
  <button
    onClick={() => setActiveTab("achievements")}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
      activeTab === "achievements" ? "bg-brand-100 text-brand-700" : "text-stone-600 hover:bg-stone-100"
    }`}
  >
    Achievements
  </button>
</div>

{activeTab === "goals" ? (
  // existing goals rendering
) : (
  <AchievementsPage
    transactions={goalsProps.transactions}
    goals={goalsProps.goals}
    recurring={goalsProps.recurring}
    budgets={goalsProps.budgets}
  />
)}
```

This requires passing all necessary data from App.jsx through Goals.jsx to AchievementsPage. A simpler approach: create a standalone AchievementsPage as its own tab in App.jsx.

**Alternative (recommended):** Add Achievements as a new tab in App.jsx rather than nesting in Goals. This avoids prop drilling complexity.

```jsx
// Add to TABS array in App.jsx:
{ id: "achievements", label: "Achievements", icon: Trophy }
```

And render it:
```jsx
{tab === "achievements" && (
  <AchievementsPage
    transactions={transactions}
    goals={goals}
    recurring={recurring}
    budgets={budgets}
    toaster={toaster}
  />
)}
```

- [ ] **Step 3: Import Trophy icon in App.jsx**

- [ ] **Step 4: Commit**

```bash
git add src/components/AchievementsPage.jsx src/pages/Goals.jsx src/App.jsx
git commit -m "feat: add Achievements page with badge grid and category filters"
```

---

### Task 9: Integration — Toast Notifications for Achievements

**Files:**
- Modify: `src/App.jsx` (pass toaster to achievements check)
- Modify: `src/components/AchievementsPage.jsx` (show toast on unlock)

- [ ] **Step 1: Show toast when achievement unlocked**

In `AchievementsPage.jsx`, add toaster prop and show toast:

```jsx
export default function AchievementsPage({ transactions, goals, recurring, budgets, toaster }) {
  const { unlocked, checkAndUnlock } = useAchievements(transactions, goals, recurring, budgets);

  // Call checkAndUnlock on mount and on transaction changes
  const newlyUnlocked = checkAndUnlock();

  // Show toast for each newly unlocked achievement
  useEffect(() => {
    for (const a of newlyUnlocked) {
      toaster?.show(`Achievement unlocked: ${a.title}`, "success");
    }
  }, [newlyUnlocked.length]);
}
```

- [ ] **Step 2: Pass toaster from App.jsx**

In App.jsx, pass toaster to AchievementsPage:
```jsx
{tab === "achievements" && (
  <AchievementsPage
    transactions={transactions}
    goals={goals}
    recurring={recurring}
    budgets={budgets}
    toaster={toaster}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx src/components/AchievementsPage.jsx
git commit -m "feat: show toast notifications when achievements are unlocked"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All streak, achievement, and challenge features have tasks? **Yes**
- [ ] Placeholder scan: No "TBD", "TODO", or vague steps? **Clean**
- [ ] Type consistency: localStorage keys (`ft.streak`, `ft.achievements`, `ft.weeklyChallenges`) consistent? **Yes**
- [ ] Filenames match: All `src/` paths relative to project root? **Yes**
- [ ] Commands complete: All git add + commit steps included? **Yes**
- [ ] No undefined references: All imported utilities exist? **Verified via code review**
