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
    id: "week-challenger",
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

export function useAchievements(transactions, goals, recurring, budgets, challengePoints) {
  const [unlocked, setUnlocked] = useLocalStorage("ft.achievements", []);

  const checkAndUnlock = () => {
    const txCount = transactions.length;
    const goalCount = goals.length;
    const completedGoals = goals.filter((g) => Math.min(100, (g.saved / g.target) * 100) >= 100).length;
    const recurringCount = recurring.length;
    const budgetCount = Object.keys(budgets).length;
    const completedChallenges = challengePoints || 0;

    const now = new Date();
    const hasEarly = transactions.some((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getHours() < 9;
    });
    const hasLate = transactions.some((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getHours() >= 22;
    });

    const currentMonth = transactions.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthIncome = currentMonth.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const monthExpense = currentMonth.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

    const ctx = {
      transactionCount: txCount,
      currentStreak: 0,
      goalCount,
      completedGoals,
      recurringCount,
      budgetCount,
      hasEarlyTransaction: hasEarly,
      hasLateTransaction: hasLate,
      savingsRate,
      daysUnderBudget: 0,
      completedChallenges,
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
