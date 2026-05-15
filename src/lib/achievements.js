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
    id: "five-categories",
    title: "Diverse Spender",
    description: "Used 5+ different expense categories",
    icon: "🎨",
    category: "habit",
    condition: (ctx) => ctx.uniqueExpenseCategories >= 5,
  },
  {
    id: "income-logged",
    title: "Full Picture",
    description: "Logged both income and expenses",
    icon: "📊",
    category: "habit",
    condition: (ctx) => ctx.hasIncome && ctx.hasExpense,
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
    title: "Challenge Champion",
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
    const txCount = (transactions?.length) ?? 0;
    const goalCount = (goals?.length) ?? 0;
    const completedGoals = (goals ?? []).filter((g) => g.saved >= g.target).length;
    const recurringCount = (recurring?.length) ?? 0;
    const budgetCount = Object.keys(budgets ?? {}).length;
    const completedChallenges = challengePoints || 0;

    const now = new Date();
    const currentMonth = (transactions ?? []).filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date + "T12:00:00");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthIncome = currentMonth.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const monthExpense = currentMonth.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

    const expenseCats = new Set((transactions ?? []).filter((t) => t.type === "expense").map((t) => t.category));
    const hasIncome = (transactions ?? []).some((t) => t.type === "income");
    const hasExpense = (transactions ?? []).some((t) => t.type === "expense");

    const ctx = {
      transactionCount: txCount,
      currentStreak: 0,
      goalCount,
      completedGoals,
      recurringCount,
      budgetCount,
      uniqueExpenseCategories: expenseCats.size,
      hasIncome,
      hasExpense,
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
