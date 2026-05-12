import { useLocalStorage } from "./storage";

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

  return {
    currentStreak,
    lastActiveDate: dates[0] || null,
    longestStreak: maxStreak,
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

export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];

export function getNextMilestone(currentStreak) {
  return STREAK_MILESTONES.find((m) => m > currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
}