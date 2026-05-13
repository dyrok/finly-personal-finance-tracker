import { useLocalStorage } from "./storage";
import { useStreak } from "./streak";

const MS_PER_DAY = 86400000;

const CHALLENGE_DEFINITIONS = [
  {
    id: "no-spend-weekend",
    title: "No Spend Weekend",
    description: "Avoid discretionary spending Saturday and Sunday",
    category: "spending",
    reward: 50,
    type: "no-spend-weekend",
    target: 1,
    unit: "weekend",
  },
  {
    id: "meal-prep-monday",
    title: "Meal Prep Monday",
    description: "Keep Food & Dining under $10 on Monday",
    category: "spending",
    reward: 30,
    type: "category-limit-day",
    target: 10,
    unit: "dollars",
    limitDay: 1,
    limitCategory: "Food & Dining",
  },
  {
    id: "home-cook-week",
    title: "Home Cook Week",
    description: "No restaurant or delivery orders for 7 days",
    category: "spending",
    reward: 60,
    type: "avoid-categories",
    target: 7,
    unit: "days",
    avoidCategories: ["Restaurants", "Food Delivery", "Coffee & Tea"],
  },
  {
    id: "coffee-break",
    title: "Coffee Break",
    description: "Avoid Coffee & Tea purchases for 7 days",
    category: "spending",
    reward: 40,
    type: "avoid-categories",
    target: 7,
    unit: "days",
    avoidCategories: ["Coffee & Tea"],
  },
  {
    id: "savings-boost",
    title: "Savings Boost",
    description: "Add $50 to a savings goal this week",
    category: "savings",
    reward: 50,
    type: "savings-goal",
    target: 50,
    unit: "dollars",
  },
  {
    id: "track-every-day",
    title: "Track Every Day",
    description: "Log at least one transaction every day this week",
    category: "habit",
    reward: 40,
    type: "daily-logging",
    target: 7,
    unit: "days",
  },
  {
    id: "budget-check",
    title: "Budget Check",
    description: "Stay under budget in every category for 5 days",
    category: "budget",
    reward: 45,
    type: "under-budget-days",
    target: 5,
    unit: "days",
  },
  {
    id: "no-impulse",
    title: "No Impulse",
    description: "Avoid Entertainment and Shopping for 7 days",
    category: "spending",
    reward: 55,
    type: "avoid-categories",
    target: 7,
    unit: "days",
    avoidCategories: ["Entertainment", "Shopping"],
  },
];

export const CHALLENGE_TYPES = CHALLENGE_DEFINITIONS.map((c) => c.type);

export const CHALLENGE_CONFIGS = Object.fromEntries(
  CHALLENGE_DEFINITIONS.map((c) => [c.type, c])
);

export function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

export function getWeekRangeISO() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startISO = monday.toLocaleDateString("en-CA");
  const endISO = sunday.toLocaleDateString("en-CA");

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mondayMonth = monthNames[monday.getMonth()];
  const sundayMonth = monthNames[sunday.getMonth()];
  let label;
  if (monday.getMonth() === sunday.getMonth()) {
    label = `${mondayMonth} ${monday.getDate()} - ${sunday.getDate()}, ${sunday.getFullYear()}`;
  } else {
    label = `${mondayMonth} ${monday.getDate()} - ${sundayMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`;
  }

  return { startISO, endISO, label };
}

export function generateWeeklyChallenge() {
  const templates = CHALLENGE_DEFINITIONS;
  const picked = templates[Math.floor(Math.random() * templates.length)];
  const { startISO, endISO } = getWeekRangeISO();

  return {
    id: picked.id,
    type: picked.type,
    title: picked.title,
    description: picked.description,
    category: picked.category,
    reward: picked.reward,
    startDate: startISO,
    endDate: endISO,
    createdAt: new Date().toISOString(),
  };
}

function getTransactionsInRange(transactions, startDate, endDate) {
  return (transactions || []).filter(
    (t) => t.date && t.date >= startDate && t.date <= endDate
  );
}

function countConsecutiveDays(transactions, startDate, endDate) {
  const txDates = new Set((transactions || []).map((t) => t.date).filter(Boolean));
  const allDays = [];
  const current = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  while (current <= end) {
    allDays.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }
  let count = 0;
  for (const day of allDays) {
    if (txDates.has(day)) count++;
    else break;
  }
  return count;
}

function getDaysUnderBudget(transactions, budgets, startDate, endDate) {
  if (!budgets || typeof budgets !== "object") return 0;
  const days = [];
  const current = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  while (current <= end) {
    days.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }
  let daysUnder = 0;
  for (const day of days) {
    let underBudget = true;
    for (const [cat, budget] of Object.entries(budgets)) {
      const spent = (transactions || [])
        .filter((t) => t.date === day && t.type === "expense" && t.category === cat)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      if (spent > budget) {
        underBudget = false;
        break;
      }
    }
    if (underBudget) daysUnder++;
  }
  return daysUnder;
}

export function getWeeklyChallengeStatus(challenge, transactions, budgets) {
  if (!challenge) {
    return { current: 0, target: 0, progress: 0, isComplete: false };
  }

  const { startISO, endISO } = getWeekRangeISO();
  const weekTxs = getTransactionsInRange(transactions, challenge.startDate || startISO, challenge.endDate || endISO);
  const config = CHALLENGE_CONFIGS[challenge.type];
  const target = config?.target || 1;

  let current = 0;
  let isComplete = false;

  switch (challenge.type) {
    case "no-spend-weekend": {
      const weekendTxCount = weekTxs.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date + "T12:00:00");
        const day = d.getDay();
        return (day === 0 || day === 6) && t.type === "expense";
      });
      const spent = weekendTxCount.reduce((sum, t) => sum + Number(t.amount), 0);
      current = spent === 0 ? 1 : 0;
      isComplete = current === 1;
      break;
    }

    case "category-limit-day": {
      const limitDay = config?.limitDay ?? 1;
      const limitCat = config?.limitCategory || "";
      const dayTxs = weekTxs.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date + "T12:00:00");
        return d.getDay() === limitDay && t.category === limitCat && t.type === "expense";
      });
      const spent = dayTxs.reduce((sum, t) => sum + Number(t.amount), 0);
      current = Math.min(target, spent);
      isComplete = spent <= target;
      break;
    }

    case "avoid-categories": {
      const avoidCats = config?.avoidCategories || [];
      const daysWithViolation = new Set();
      weekTxs.forEach((t) => {
        if (avoidCats.includes(t.category) && t.type === "expense") {
          daysWithViolation.add(t.date);
        }
      });
      const currentDate = new Date((challenge.startDate || startISO) + "T12:00:00");
      const endDate = new Date((challenge.endDate || endISO) + "T12:00:00");
      let cleanDays = 0;
      while (currentDate <= endDate) {
        const dayStr = currentDate.toLocaleDateString("en-CA");
        if (!daysWithViolation.has(dayStr)) cleanDays++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      current = cleanDays;
      isComplete = cleanDays >= target;
      break;
    }

    case "savings-goal": {
      const saved = weekTxs
        .filter((t) => t.type === "income" && (t.category === "Savings" || t.category?.toLowerCase().includes("saving")))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      current = saved;
      isComplete = saved >= target;
      break;
    }

    case "daily-logging": {
      current = countConsecutiveDays(weekTxs, challenge.startDate || startISO, challenge.endDate || endISO);
      isComplete = current >= target;
      break;
    }

    case "under-budget-days": {
      current = getDaysUnderBudget(weekTxs, budgets, challenge.startDate || startISO, challenge.endDate || endISO);
      isComplete = current >= target;
      break;
    }

    default: {
      current = 0;
      isComplete = false;
    }
  }

  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return { current, target, progress, complete: isComplete };
}

export function useWeeklyChallenge() {
  const [challengeData, setChallengeData] = useLocalStorage("ft.weeklyChallenges", {
    activeChallenge: null,
    acceptedChallenge: null,
    completedChallenges: [],
    challengePoints: 0,
    lastChallengeReset: null,
  });

  const { startISO, endISO } = getWeekRangeISO();

  const initChallenge = () => {
    if (!challengeData.activeChallenge) return;

    const activeEnd = challengeData.activeChallenge.endDate;
    const today = getTodayISO();

    if (activeEnd && activeEnd < today) {
      const completed = challengeData.activeChallenge;
      setChallengeData((prev) => ({
        ...prev,
        completedChallenges: [
          ...prev.completedChallenges,
          {
            id: completed.id,
            title: completed.title,
            type: completed.type,
            reward: completed.reward,
            completedAt: new Date().toISOString(),
            expired: true,
          },
        ].slice(-20),
        activeChallenge: null,
        acceptedChallenge: null,
      }));
    }
  };

  const refreshChallenge = () => {
    if (!challengeData.activeChallenge) {
      const newChallenge = generateWeeklyChallenge();
      setChallengeData((prev) => ({
        ...prev,
        activeChallenge: newChallenge,
      }));
    }
  };

  const acceptChallenge = () => {
    if (!challengeData.activeChallenge) return;
    setChallengeData((prev) => ({
      ...prev,
      acceptedChallenge: { ...prev.activeChallenge },
    }));
  };

  const completeChallenge = () => {
    if (!challengeData.acceptedChallenge) return;
    const completed = challengeData.acceptedChallenge;
    setChallengeData((prev) => ({
      ...prev,
      completedChallenges: [
        ...prev.completedChallenges,
        {
          id: completed.id,
          title: completed.title,
          type: completed.type,
          reward: completed.reward,
          completedAt: new Date().toISOString(),
          expired: false,
        },
      ].slice(-20),
      challengePoints: (prev.challengePoints || 0) + (completed.reward || 0),
      activeChallenge: null,
      acceptedChallenge: null,
    }));
  };

  const dismissChallenge = () => {
    setChallengeData((prev) => ({
      ...prev,
      activeChallenge: null,
      acceptedChallenge: null,
    }));
  };

  const resetAllChallenges = () => {
    setChallengeData({
      activeChallenge: null,
      acceptedChallenge: null,
      completedChallenges: [],
    });
  };

  return {
    challengeData,
    initChallenge,
    refreshChallenge,
    acceptChallenge,
    completeChallenge,
    dismissChallenge,
    resetAllChallenges,
    getWeeklyChallengeStatus,
    CHALLENGE_DEFINITIONS,
    CHALLENGE_TYPES,
    CHALLENGE_CONFIGS,
  };
}